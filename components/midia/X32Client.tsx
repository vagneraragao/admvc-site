'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wifi, WifiOff, Sliders, Volume2, VolumeX, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
    ip: string
    port: number
}

// Canais padrão do X32 (32 canais + 16 mix bus)
const CANAIS = Array.from({ length: 32 }, (_, i) => ({
    id: `ch/${String(i + 1).padStart(2, '0')}`,
    label: `CH ${i + 1}`,
    tipo: 'channel' as const,
}))

const MIX_BUS = Array.from({ length: 16 }, (_, i) => ({
    id: `bus/${String(i + 1).padStart(2, '0')}`,
    label: `Bus ${i + 1}`,
    tipo: 'bus' as const,
}))

const MASTERS = [
    { id: 'main/st', label: 'Main L/R', tipo: 'master' as const },
    { id: 'main/m', label: 'Mono/C', tipo: 'master' as const },
]

type Fader = {
    id: string
    label: string
    tipo: 'channel' | 'bus' | 'master'
    value: number
    muted: boolean
}

export default function X32Client({ ip, port }: Props) {
    const [modo, setModo] = useState<'proxy' | 'directo'>('proxy')
    const [proxyUrl, setProxyUrl] = useState('ws://localhost:8080')
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [faders, setFaders] = useState<Fader[]>([])
    const [vista, setVista] = useState<'channels' | 'bus' | 'master'>('channels')
    const [visiveisCh, setVisiveisCh] = useState(8) // Quantos canais mostrar
    const [offsetCh, setOffsetCh] = useState(0)
    const wsRef = useRef<WebSocket | null>(null)

    // Inicializar faders
    useEffect(() => {
        const all = [...CANAIS, ...MIX_BUS, ...MASTERS].map(c => ({
            ...c, value: 0.75, muted: false
        }))
        setFaders(all)
    }, [])

    // Conectar via WebSocket ao proxy local
    const connect = useCallback(async () => {
        if (!ip) return
        setConnecting(true)

        try {
            const ws = new WebSocket(proxyUrl)
            ws.onopen = () => {
                setConnected(true)
                setConnecting(false)
                wsRef.current = ws
                // Pedir valores actuais de todos os faders
                ws.send(JSON.stringify({ type: 'subscribe', target: ip, port }))
            }
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.type === 'fader') {
                        setFaders(prev => prev.map(f =>
                            f.id === msg.channel ? { ...f, value: msg.value } : f
                        ))
                    }
                    if (msg.type === 'mute') {
                        setFaders(prev => prev.map(f =>
                            f.id === msg.channel ? { ...f, muted: msg.muted } : f
                        ))
                    }
                } catch { }
            }
            ws.onclose = () => { setConnected(false); wsRef.current = null }
            ws.onerror = () => { setConnected(false); setConnecting(false) }
        } catch {
            setConnecting(false)
        }
    }, [ip, port, proxyUrl])

    const disconnect = () => {
        wsRef.current?.close()
        setConnected(false)
    }

    // Enviar comando de fader
    const sendFader = (channelId: string, value: number) => {
        setFaders(prev => prev.map(f => f.id === channelId ? { ...f, value } : f))
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'fader',
                channel: channelId,
                value,
                osc: `/${channelId}/mix/fader`
            }))
        }
    }

    const sendMute = (channelId: string) => {
        const fader = faders.find(f => f.id === channelId)
        if (!fader) return
        const newMuted = !fader.muted
        setFaders(prev => prev.map(f => f.id === channelId ? { ...f, muted: newMuted } : f))
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'mute',
                channel: channelId,
                muted: newMuted,
                osc: `/${channelId}/mix/on`
            }))
        }
    }

    if (!ip) {
        return (
            <div className="bg-bg2 border border-soft rounded-2xl p-8 text-center space-y-4">
                <WifiOff size={32} className="mx-auto text-muted/30" />
                <p className="text-sm font-black uppercase tracking-widest text-muted">Mesa nao configurada</p>
                <p className="text-xs text-muted/60">Configure o IP nas <Link href="/admin/midia" className="text-figueira underline">configuracoes de midia</Link>.</p>
            </div>
        )
    }

    // Faders da vista actual
    const fadersVista = vista === 'channels'
        ? faders.filter(f => f.tipo === 'channel').slice(offsetCh, offsetCh + visiveisCh)
        : vista === 'bus'
            ? faders.filter(f => f.tipo === 'bus')
            : faders.filter(f => f.tipo === 'master')

    return (
        <div className="space-y-4">
            {/* BARRA DE CONEXÃO */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-soft text-muted'}`}>
                        {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-fg uppercase tracking-widest">{ip}:{port}</p>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">
                            {connected ? 'Conectado via WebSocket' : 'Desconectado'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)}
                        placeholder="ws://localhost:8080"
                        className="flex-1 sm:w-48 bg-bg border border-soft rounded-lg px-3 py-2 text-[10px] font-mono text-fg outline-none focus:border-figueira" />
                    {connected ? (
                        <button onClick={disconnect} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            Desligar
                        </button>
                    ) : (
                        <button onClick={connect} disabled={connecting}
                            className="px-4 py-2 rounded-lg bg-figueira text-white text-[9px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {connecting ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                            Conectar
                        </button>
                    )}
                </div>
            </div>

            {/* TABS: Channels / Bus / Master */}
            <div className="flex gap-1.5">
                {[
                    { id: 'channels' as const, label: 'Canais', count: 32 },
                    { id: 'bus' as const, label: 'Mix Bus', count: 16 },
                    { id: 'master' as const, label: 'Master', count: 2 },
                ].map(t => (
                    <button key={t.id} onClick={() => { setVista(t.id); setOffsetCh(0) }}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${vista === t.id ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30'}`}>
                        {t.label} <span className="opacity-50 ml-1">{t.count}</span>
                    </button>
                ))}
            </div>

            {/* PAGINAÇÃO DE CANAIS */}
            {vista === 'channels' && (
                <div className="flex items-center gap-2">
                    <button onClick={() => setOffsetCh(Math.max(0, offsetCh - visiveisCh))} disabled={offsetCh === 0}
                        className="px-3 py-1.5 rounded-lg bg-bg2 border border-soft text-[9px] font-black uppercase text-muted disabled:opacity-30">
                        ← Ant
                    </button>
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest">
                        CH {offsetCh + 1}-{Math.min(offsetCh + visiveisCh, 32)}
                    </span>
                    <button onClick={() => setOffsetCh(Math.min(32 - visiveisCh, offsetCh + visiveisCh))} disabled={offsetCh + visiveisCh >= 32}
                        className="px-3 py-1.5 rounded-lg bg-bg2 border border-soft text-[9px] font-black uppercase text-muted disabled:opacity-30">
                        Seg →
                    </button>
                    <select value={visiveisCh} onChange={e => { setVisiveisCh(Number(e.target.value)); setOffsetCh(0) }}
                        className="ml-auto bg-bg2 border border-soft rounded-lg px-2 py-1.5 text-[9px] font-bold text-muted outline-none">
                        <option value={8}>8 canais</option>
                        <option value={16}>16 canais</option>
                        <option value={32}>32 canais</option>
                    </select>
                </div>
            )}

            {/* FADERS */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 overflow-x-auto">
                <div className="flex gap-3 min-w-min">
                    {fadersVista.map(fader => (
                        <div key={fader.id} className="flex flex-col items-center gap-2 w-16 shrink-0">
                            {/* VALOR */}
                            <span className="text-[8px] font-black text-muted uppercase tracking-widest">
                                {Math.round(fader.value * 100)}%
                            </span>

                            {/* FADER VERTICAL */}
                            <div className="relative h-40 w-8 bg-bg border border-soft rounded-lg overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 transition-all duration-100 rounded-b-lg"
                                    style={{
                                        height: `${fader.value * 100}%`,
                                        backgroundColor: fader.muted ? '#ef4444' : fader.value > 0.85 ? '#ef4444' : fader.value > 0.6 ? '#f59e0b' : '#22c55e',
                                        opacity: fader.muted ? 0.3 : 0.6,
                                    }} />
                                <input type="range" min="0" max="1" step="0.01" value={fader.value}
                                    onChange={e => sendFader(fader.id, Number(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                            </div>

                            {/* MUTE */}
                            <button onClick={() => sendMute(fader.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[7px] font-black ${fader.muted ? 'bg-red-500 text-white' : 'bg-bg border border-soft text-muted hover:border-red-500/30'}`}>
                                {fader.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>

                            {/* LABEL */}
                            <span className="text-[7px] font-black uppercase tracking-widest text-muted text-center leading-tight">
                                {fader.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* INFO */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 text-[9px] text-muted/60 space-y-1">
                <p className="font-black uppercase tracking-widest text-muted text-[8px]">Como conectar:</p>
                <p>1. Descarregue o proxy local: <code className="bg-bg px-1.5 py-0.5 rounded text-fg font-mono">npx admvc-x32-proxy</code></p>
                <p>2. Execute no PC da igreja (mesma rede que o X32)</p>
                <p>3. Clique "Conectar" acima com o endereco do proxy (default: ws://localhost:8080)</p>
                <p>4. Os faders sincronizam automaticamente com a mesa</p>
            </div>
        </div>
    )
}
