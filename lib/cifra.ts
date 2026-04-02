// lib/cifra.ts — Transposição de acordes e parsing de cifras

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTAS_BEMOL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

// Mapa de equivalências (bemol → sustenido)
const NORMALIZAR: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
}

/**
 * Extrai a nota raiz de um acorde. Ex: "Am7" → "A", "F#m" → "F#", "Bb" → "Bb"
 */
function extrairRaiz(acorde: string): { raiz: string; resto: string } {
    let raiz = acorde[0]
    let resto = acorde.slice(1)

    if (resto.startsWith('#') || resto.startsWith('b')) {
        raiz += resto[0]
        resto = resto.slice(1)
    }

    return { raiz, resto }
}

/**
 * Transpõe um único acorde por N semitons.
 */
function transporAcorde(acorde: string, semitons: number): string {
    if (!acorde || acorde.trim() === '') return acorde

    // Lidar com acordes compostos (ex: C/G)
    if (acorde.includes('/')) {
        const [principal, baixo] = acorde.split('/')
        return `${transporAcorde(principal, semitons)}/${transporAcorde(baixo, semitons)}`
    }

    const { raiz, resto } = extrairRaiz(acorde)
    const raizNormal = NORMALIZAR[raiz] || raiz
    const idx = NOTAS.indexOf(raizNormal)

    if (idx === -1) return acorde // Não é um acorde reconhecido

    const novoIdx = ((idx + semitons) % 12 + 12) % 12
    return NOTAS[novoIdx] + resto
}

/**
 * Calcula quantos semitons entre duas notas.
 */
export function calcularSemitons(de: string, para: string): number {
    const deNormal = NORMALIZAR[de] || de
    const paraNormal = NORMALIZAR[para] || para
    const idxDe = NOTAS.indexOf(deNormal)
    const idxPara = NOTAS.indexOf(paraNormal)
    if (idxDe === -1 || idxPara === -1) return 0
    return ((idxPara - idxDe) % 12 + 12) % 12
}

/**
 * Transpõe todos os acordes [entre brackets] numa cifra por N semitons.
 */
export function transporCifra(cifra: string, semitons: number): string {
    if (semitons === 0) return cifra
    return cifra.replace(/\[([^\]]+)\]/g, (_, acorde) => {
        return `[${transporAcorde(acorde, semitons)}]`
    })
}

/**
 * Parse da cifra em linhas com segmentos {tipo: 'texto'|'acorde', valor}.
 */
export function parseCifra(cifra: string): { linhas: { tipo: 'texto' | 'acorde'; valor: string }[][] } {
    const linhas = cifra.split('\n').map(linha => {
        const segmentos: { tipo: 'texto' | 'acorde'; valor: string }[] = []
        let restante = linha

        while (restante.length > 0) {
            const idx = restante.indexOf('[')
            if (idx === -1) {
                segmentos.push({ tipo: 'texto', valor: restante })
                break
            }
            if (idx > 0) {
                segmentos.push({ tipo: 'texto', valor: restante.slice(0, idx) })
            }
            const fim = restante.indexOf(']', idx)
            if (fim === -1) {
                segmentos.push({ tipo: 'texto', valor: restante.slice(idx) })
                break
            }
            segmentos.push({ tipo: 'acorde', valor: restante.slice(idx + 1, fim) })
            restante = restante.slice(fim + 1)
        }

        return segmentos
    })

    return { linhas }
}

export const TONS_DISPONIVEIS = NOTAS
