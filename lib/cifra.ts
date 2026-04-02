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
 * Se a cifra não tiver brackets, tenta transpor acordes soltos no início de palavras.
 */
export function transporCifra(cifra: string, semitons: number): string {
    if (semitons === 0) return cifra

    // Se tem brackets — formato normal
    if (cifra.includes('[')) {
        return cifra.replace(/\[([^\]]+)\]/g, (_, acorde) => {
            return `[${transporAcorde(acorde, semitons)}]`
        })
    }

    // Fallback: transpor acordes soltos (texto plano do CifraClub não convertido)
    return cifra.replace(/\b([A-G][#b]?(?:m|M|dim|aug|sus[24]?|add|maj|min)?[0-9]*(?:\/[A-G][#b]?)?)\b/g, (match) => {
        return transporAcorde(match, semitons)
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

// ============================================================================
// IMPORTAÇÃO — Converter formato CifraClub para formato bracket
// ============================================================================

// Regex abrangente para acordes musicais
// Aceita: C, Am, F#m7, Bb7, Cmaj7, Dsus4, G7M, Em/B, A(add9), C2, etc.
const ACORDE_REGEX = /^[A-G][#b]?(?:m|M|dim|aug|sus[24]?|add[0-9]*|maj|min|°|ø)?[0-9]*(?:M)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?$/

/**
 * Verifica se uma linha contém apenas acordes (formato CifraClub).
 */
function isLinhaDeAcordes(linha: string): boolean {
    const trimmed = linha.trim()
    if (!trimmed) return false
    const partes = trimmed.split(/\s+/)
    if (partes.length === 0) return false
    // Pelo menos 60% dos tokens devem ser acordes válidos, e pelo menos 1
    const acordes = partes.filter(p => ACORDE_REGEX.test(p))
    // Também considerar linha de acordes se todos os tokens são curtos (< 6 chars) e maioria são acordes
    const todosCurtos = partes.every(p => p.length <= 8)
    return acordes.length > 0 && (acordes.length >= partes.length * 0.5 || (todosCurtos && acordes.length >= partes.length * 0.4))
}

/**
 * Extrai acordes com as suas posições (coluna) numa linha.
 */
function extrairAcordesComPosicao(linha: string): { acorde: string; posicao: number }[] {
    const resultado: { acorde: string; posicao: number }[] = []
    const regex = /\S+/g
    let match
    while ((match = regex.exec(linha)) !== null) {
        if (ACORDE_REGEX.test(match[0])) {
            resultado.push({ acorde: match[0], posicao: match.index })
        }
    }
    return resultado
}

/**
 * Mescla uma linha de acordes com a linha de letra abaixo.
 */
function mesclarAcordesComLetra(linhaAcordes: string, linhaLetra: string): string {
    const acordes = extrairAcordesComPosicao(linhaAcordes)
    if (acordes.length === 0) return linhaLetra

    let resultado = ''
    let ultimaPosicao = 0

    // Ordena por posição (já deve estar, mas por segurança)
    acordes.sort((a, b) => a.posicao - b.posicao)

    for (const { acorde, posicao } of acordes) {
        // Adiciona o texto da letra até à posição do acorde
        const pos = Math.min(posicao, linhaLetra.length)
        resultado += linhaLetra.slice(ultimaPosicao, pos)
        resultado += `[${acorde}]`
        ultimaPosicao = pos
    }

    // Adiciona o resto da letra
    resultado += linhaLetra.slice(ultimaPosicao)

    return resultado
}

/**
 * Converte texto copiado do CifraClub (acordes em linha separada)
 * para o formato bracket [Am]letra[G]letra.
 *
 * Também aceita texto já no formato bracket (devolve como está).
 */
export function importarCifraClub(texto: string): string {
    // Se já tem brackets, devolve como está
    if (texto.includes('[') && texto.includes(']')) return texto.trim()

    const linhas = texto.split('\n')
    const resultado: string[] = []
    let i = 0

    while (i < linhas.length) {
        const linhaAtual = linhas[i]

        if (isLinhaDeAcordes(linhaAtual)) {
            // Verifica se a próxima linha é letra
            const proximaLinha = i + 1 < linhas.length ? linhas[i + 1] : ''

            if (proximaLinha.trim() && !isLinhaDeAcordes(proximaLinha)) {
                // Mescla acordes + letra
                resultado.push(mesclarAcordesComLetra(linhaAtual, proximaLinha))
                i += 2 // Salta ambas as linhas
            } else {
                // Linha de acordes sozinha (sem letra abaixo) — converte cada acorde
                const acordes = linhaAtual.trim().split(/\s+/).filter(a => ACORDE_REGEX.test(a))
                resultado.push(acordes.map(a => `[${a}]`).join(' '))
                i++
            }
        } else {
            // Linha normal (texto, linha vazia, etc.)
            resultado.push(linhaAtual)
            i++
        }
    }

    return resultado.join('\n').trim()
}
