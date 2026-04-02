'use client'

import { useState, useEffect } from 'react'
import {
    Lightbulb, WifiOff, Wifi, Loader2, Sun, Power, Zap,
    ChevronDown, ChevronUp, TerminalSquare, Settings
} from 'lucide-react'
import Link from 'next/link'
import type { LumikitScene, LumikitDimmer } from '@/actions/midia-actions'

// Mapeamento letra → índice
const SCENE_LETTERS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']

interface Props {
    url: string
    scenes: LumikitScene[]
    dimmers: LumikitDimmer[]
}

type LogItem = {
    id: number
    time: string
    message: string
    type: 'info' | 'success' | 'error' | 'request'
}

export default function LumikitClient({ url, scenes, dimmers }: Props) {
    const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
    const [cenaAtiva, setCenaAtiva] = useState<string | null>(null)
    const [enviando, setEnviando] = useState<string | null>(null)
    const [dimmerValues, setDimmerValues] = useState<Record<string, number>>({})
    const [blackout, setBlackout] = useState(false)
    const [logs, setLogs] = useState<LogItem[]>([])
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)

    const baseUrl = url?.replace(/\/$/, '') || ''

    const addLog = (message: string, type: LogItem['type'] = 'info') => {
        const time = new Date().toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setLogs(prev => [{ id: Date.now() + Math.random(), time, message, type }, ...prev].slice(0, 30))
    }

    // Inicializar dimmers a 100%
    useEffect(() => {
        const initial: Record<string, number> = {}
        dimmers.forEach(d => { initial[d.id] = 100 })
        setDimmerValues(initial)
    }, [dimmers])

    // Auto-connect
    useEffect(() => {
        if (!baseUrl) {
            addLog('Lumikit nao configurado. Configure em Admin > Midia.', 'error')
            return
        }
        const connect = async () => {
            setStatus('testing')
            try {
                addLog(`A conectar a ${baseUrl}...`, 'request')
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 4000)
                const res = await fetch(`${baseUrl}/services/edmx_get_active_scene`, { signal: controller.signal })
                clearTimeout(timeout)
                if (res.ok) {
                    const data = await res.text()
                    setStatus('connected')
                    addLog(`Lumikit conectado! ${data}`, 'success')
                } else {
                    setStatus('error')
                    addLog(`Lumikit respondeu com HTTP ${res.status}`, 'error')
                }
            } catch (err: any) {
                setStatus('error')
                const msg = err.name === 'AbortError' ? 'Timeout (4s)' : err.message
                addLog(`Falha na conexao: ${msg}`, 'error')
                if (!baseUrl.includes('localhost')) {
                    addLog('Dica: se a app esta em HTTPS, use o proxy local (http://localhost:8081)', 'info')
                }
            }
        }
        connect()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Enviar comando GET para Lumikit (via proxy ou directo)
    const sendCommand = async (endpoint: string, label: string) => {
        const fullUrl = `${baseUrl}${endpoint}`
        addLog(`[GET] ${endpoint}`, 'request')
        try {
            const res = await fetch(fullUrl)
            const text = await res.text()
            addLog(`[OK] ${label} → ${text.substring(0, 80)}`, 'success')
            return true
        } catch (err: any) {
            addLog(`[ERRO] ${label}: ${err.message}`, 'error')
            return false
        }
    }

    // Ativar cena
    const acionarCena = async (scene: LumikitScene) => {
        setEnviando(scene.id)
        const letra = SCENE_LETTERS[scene.scene] || scene.scene
        const ok = await sendCommand(
            `/services/edmx_change_scene/${scene.page}/${scene.scene}`,
            `Cena "${scene.nome}" (Page ${scene.page + 1}, ${letra})`
        )
        if (ok) {
            setCenaAtiva(scene.id)
            setBlackout(false)
        }
        setEnviando(null)
    }

    // Blackout
    const toggleBlackout = async () => {
        const newState = !blackout
        const endpoint = newState ? '/services/main_set_blackout_on' : '/services/main_set_blackout_off'
        const ok = await sendCommand(endpoint, newState ? 'Blackout ON' : 'Blackout OFF')
        if (ok) {
            setBlackout(newState)
            if (newState) setCenaAtiva(null)
        }
    }

    // Dimmer via playback
    const ajustarDimmer = async (dimmer: LumikitDimmer, valor: number) => {
        setDimmerValues(prev => ({ ...prev, [dimmer.id]: valor }))
        const letra = SCENE_LETTERS[dimmer.scene] || dimmer.scene
        await sendCommand(
            `/services/playback_set_levels/${dimmer.page}/${dimmer.scene}/${valor}`,
            `Dimmer "${dimmer.nome}" → ${valor}% (Page ${dimmer.page + 1}, ${letra})`
        )
    }

    if (!url) {
        return (
            <div className="bg-bg2 border border-soft rounded-2xl p-8 text-center space-y-4">
                <WifiOff size={32} className="mx-auto text-muted/30" />
                <p className="text-sm font-black uppercase tracking-widest text-muted">Lumikit nao configurado</p>
                <p className="text-xs text-muted/60">Configure o endereco nas <Link href="/admin/midia" className="text-figueira underline">configuracoes de midia</Link>.</p>
            </div>
        )
    }

    const cores: Record<string, { idle: string; active: string }> = {
        blue:    { idle: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white', active: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30' },
        purple:  { idle: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500 hover:text-white', active: 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30' },
        amber:   { idle: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white', active: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30' },
        indigo:  { idle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white', active: 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30' },
        emerald: { idle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white', active: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' },
        red:     { idle: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white', active: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30' },
        pink:    { idle: 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500 hover:text-white', active: 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/30' },
        cyan:    { idle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500 hover:text-white', active: 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30' },
    }

    const isDisabled = status !== 'connected'

    return (
        <div className="space-y-6">
            {/* HEADER — status read-only */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : status === 'testing' ? 'bg-soft text-muted' : 'bg-soft text-muted'}`}>
                        {status === 'testing' ? <Loader2 size={18} className="animate-spin" /> : status === 'connected' ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-fg uppercase tracking-widest">Lumikit</p>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">
                            {status === 'connected' ? 'Conectado' : status === 'testing' ? 'A conectar...' : 'Desconectado'}
                            {baseUrl && ` — ${baseUrl.replace(/^https?:\/\//, '')}`}
                        </p>
                    </div>
                </div>
                <Link href="/admin/midia" className="text-[8px] font-bold uppercase tracking-widest text-muted hover:text-figueira transition-colors flex items-center gap-1">
                    <Settings size={10} /> Config
                </Link>
            </div>

            {/* CENAS */}
            {scenes.length > 0 ? (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 px-1">
                        <Zap size={12} /> Cenas
                    </h3>
                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 transition-all ${isDisabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {scenes.map(scene => {
                            const isAtiva = cenaAtiva === scene.id
                            const corConfig = cores[scene.cor] || cores.blue
                            const letra = SCENE_LETTERS[scene.scene] || '?'
                            return (
                                <button key={scene.id} onClick={() => acionarCena(scene)} disabled={enviando !== null}
                                    className={`p-5 rounded-2xl border-2 transition-all active:scale-95 text-left space-y-2 ${isAtiva ? corConfig.active : corConfig.idle}`}>
                                    <div className="flex items-center justify-between">
                                        <Lightbulb size={20} />
                                        {enviando === scene.id && <Loader2 size={14} className="animate-spin" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest">{scene.nome}</p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                                            Page {scene.page + 1} / Cena {letra}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}

                        {/* BLACKOUT — sempre presente */}
                        <button onClick={toggleBlackout}
                            className={`p-5 rounded-2xl border-2 transition-all active:scale-95 text-left space-y-2 ${blackout ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                            <Power size={20} />
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">Blackout</p>
                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                                    {blackout ? 'Ligado — tudo apagado' : 'Desligar tudo'}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-bg2 border border-soft rounded-2xl p-6 text-center space-y-2">
                    <Lightbulb size={24} className="mx-auto text-muted/30" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Nenhuma cena configurada</p>
                    <p className="text-[9px] text-muted/60">Configure as cenas em <Link href="/admin/midia" className="text-figueira underline">Admin &gt; Midia</Link>.</p>
                </div>
            )}

            {/* DIMMERS */}
            {dimmers.length > 0 && (
                <div className={`space-y-3 transition-all ${isDisabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 px-1">
                        <Sun size={12} /> Dimmers
                    </h3>
                    <div className="grid gap-3">
                        {dimmers.map(dimmer => {
                            const valor = dimmerValues[dimmer.id] ?? 100
                            const letra = SCENE_LETTERS[dimmer.scene] || '?'
                            return (
                                <div key={dimmer.id} className="bg-bg2 border border-soft rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-fg flex items-center gap-2">
                                            <Sun size={14} className="text-amber-500" /> {dimmer.nome}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-bold text-muted uppercase tracking-widest">
                                                P{dimmer.page + 1}/{letra}
                                            </span>
                                            <span className="text-lg font-black text-fg w-12 text-right">{valor}%</span>
                                        </div>
                                    </div>
                                    <input type="range" min="0" max="100" value={valor}
                                        onChange={e => ajustarDimmer(dimmer, Number(e.target.value))}
                                        className="w-full h-2 accent-amber-500 cursor-pointer" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TERMINAL DE LOGS */}
            <div className="bg-black/95 rounded-2xl shadow-inner flex flex-col overflow-hidden border border-white/10 shrink-0 transition-all duration-300">
                <button
                    onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                    className="bg-white/5 hover:bg-white/10 p-3 flex items-center justify-between w-full transition-colors active:bg-white/15"
                >
                    <div className="flex items-center gap-2">
                        <TerminalSquare size={14} className="text-white/60" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                            Terminal de Logs {logs.length > 0 && `(${logs.length})`}
                        </span>
                    </div>
                    {isTerminalOpen ? <ChevronDown size={14} className="text-white/60" /> : <ChevronUp size={14} className="text-white/60" />}
                </button>

                {isTerminalOpen && (
                    <div className="p-3 h-40 overflow-y-auto font-mono text-[9px] space-y-1.5 bg-black/50 scrollbar-hide">
                        {logs.length === 0 ? (
                            <p className="text-white/30 text-center italic mt-10">A aguardar comandos...</p>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex gap-2 leading-relaxed border-b border-white/5 pb-1">
                                    <span className="text-white/30 shrink-0">[{log.time}]</span>
                                    <span className={`break-all ${
                                        log.type === 'request' ? 'text-blue-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                        log.type === 'error' ? 'text-red-400 font-bold' :
                                        'text-white/60'
                                    }`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
