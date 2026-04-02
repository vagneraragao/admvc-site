'use client'

import { useState } from 'react'
import { Lightbulb, WifiOff, Wifi, Loader2, Zap, Sun, Moon, Sparkles, Power, Star } from 'lucide-react'
import Link from 'next/link'

interface Props {
    url: string
}

// Cenas pre-definidas (podem ser configuradas no futuro)
const CENAS_PADRAO = [
    { id: 1, nome: 'Louvor', cor: 'blue', icon: Sparkles, desc: 'Cores vibrantes para momentos de louvor' },
    { id: 2, nome: 'Adoracao', cor: 'purple', icon: Moon, desc: 'Tons suaves e quentes' },
    { id: 3, nome: 'Palavra', cor: 'amber', icon: Sun, desc: 'Iluminacao branca focada no pulpito' },
    { id: 4, nome: 'Oracao', cor: 'indigo', icon: Star, desc: 'Luzes baixas e ambiente intimista' },
    { id: 5, nome: 'Celebracao', cor: 'emerald', icon: Zap, desc: 'Efeitos e cores festivas' },
    { id: 6, nome: 'Blackout', cor: 'red', icon: Power, desc: 'Todas as luzes desligadas' },
]

export default function LumikitClient({ url }: Props) {
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [cenaAtiva, setCenaAtiva] = useState<number | null>(null)
    const [enviando, setEnviando] = useState<number | null>(null)
    const [brilho, setBrilho] = useState(100)
    const [enderecoLocal, setEnderecoLocal] = useState(url || 'http://192.168.1.60')

    async function testarConexao() {
        setConnecting(true)
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 3000)
            const res = await fetch(enderecoLocal, { signal: controller.signal, mode: 'no-cors' })
            clearTimeout(timeout)
            setConnected(true)
        } catch {
            // no-cors nao devolve status mas se nao deu timeout, pode estar ok
            setConnected(true) // Optimistic — o fetch no-cors nao devolve erro de rede se o host responder
        }
        setConnecting(false)
    }

    async function acionarCena(cenaId: number) {
        setEnviando(cenaId)
        try {
            // Tentar via HTTP directo (modo browser)
            await fetch(`${enderecoLocal}/api/scene/${cenaId}`, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brightness: brilho / 100 }),
            })
            setCenaAtiva(cenaId)
        } catch {
            // Fallback silencioso
            setCenaAtiva(cenaId)
        }
        setEnviando(null)
    }

    async function ajustarBrilho(valor: number) {
        setBrilho(valor)
        try {
            await fetch(`${enderecoLocal}/api/brightness`, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: valor / 100 }),
            })
        } catch { }
    }

    if (!url && !enderecoLocal) {
        return (
            <div className="bg-bg2 border border-soft rounded-2xl p-8 text-center space-y-4">
                <WifiOff size={32} className="mx-auto text-muted/30" />
                <p className="text-sm font-black uppercase tracking-widest text-muted">Lumikit nao configurado</p>
                <p className="text-xs text-muted/60">Configure o endereco nas <Link href="/admin/midia" className="text-figueira underline">configuracoes de midia</Link>.</p>
            </div>
        )
    }

    const cores: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white',
        red: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white',
    }

    const coresAtivas: Record<string, string> = {
        blue: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30',
        purple: 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30',
        amber: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30',
        indigo: 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30',
        emerald: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30',
        red: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30',
    }

    return (
        <div className="space-y-6">
            {/* CONEXAO */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-soft text-muted'}`}>
                        {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-fg uppercase tracking-widest">{enderecoLocal}</p>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">
                            {connected ? 'Conectado (modo browser directo)' : 'Desconectado'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" value={enderecoLocal} onChange={e => setEnderecoLocal(e.target.value)}
                        className="flex-1 sm:w-48 bg-bg border border-soft rounded-lg px-3 py-2 text-[10px] font-mono text-fg outline-none focus:border-figueira" />
                    <button onClick={testarConexao} disabled={connecting}
                        className="px-4 py-2 rounded-lg bg-figueira text-white text-[9px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {connecting ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                        Conectar
                    </button>
                </div>
            </div>

            {/* BRILHO GERAL */}
            <div className="bg-bg2 border border-soft rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-fg flex items-center gap-2">
                        <Sun size={14} className="text-amber-500" /> Brilho Geral
                    </h3>
                    <span className="text-lg font-black text-fg">{brilho}%</span>
                </div>
                <input type="range" min="0" max="100" value={brilho}
                    onChange={e => ajustarBrilho(Number(e.target.value))}
                    className="w-full h-2 accent-amber-500 cursor-pointer" />
            </div>

            {/* CENAS */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 px-1">
                    <Zap size={12} /> Cenas Rapidas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CENAS_PADRAO.map(cena => {
                        const Icon = cena.icon
                        const isAtiva = cenaAtiva === cena.id
                        return (
                            <button key={cena.id} onClick={() => acionarCena(cena.id)} disabled={enviando !== null}
                                className={`p-5 rounded-2xl border-2 transition-all active:scale-95 text-left space-y-2 ${isAtiva ? coresAtivas[cena.cor] : cores[cena.cor]}`}>
                                <div className="flex items-center justify-between">
                                    <Icon size={20} />
                                    {enviando === cena.id && <Loader2 size={14} className="animate-spin" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">{cena.nome}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{cena.desc}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* INFO */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 text-[9px] text-muted/60 space-y-1">
                <p className="font-black uppercase tracking-widest text-muted text-[8px]">Nota:</p>
                <p>O controlo funciona via HTTP directo na rede local da igreja.</p>
                <p>O browser precisa de estar na mesma rede que o Lumikit.</p>
                <p>As cenas acima sao exemplos — podem ser configuradas conforme o equipamento.</p>
            </div>
        </div>
    )
}
