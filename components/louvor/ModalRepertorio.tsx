'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Music, Youtube, ChevronRight, Hash, GripVertical, Trash2, Loader2, X, Plus, CheckCircle2, ListMusic, MonitorUp, Search, RefreshCcw, TerminalSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    adicionarMusicaLocalAoEvento,
    removerMusicaDoRepertorio,
    atualizarOrdemRepertorio,
    sincronizarAcervoLocal,
    buscarMusicasLocalmente
} from '@/actions/louvor-actions'
import Portal from '@/components/ui/Portal'

type RepertorioItem = {
    id: string;
    ordem: number;
    tom_tocado: string;
    musica: { id: string; titulo: string; artista: string | null; link_video: string | null; holyrics_id: string | null; }
}

interface ModalRepertorioProps {
    eventoId: number;
    repertorioInical: RepertorioItem[];
    podeEditar: boolean;
}

export default function ModalRepertorio({ eventoId, repertorioInical, podeEditar }: ModalRepertorioProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [lista, setLista] = useState<RepertorioItem[]>([])

    // Estados Adicionar
    const [isAdding, setIsAdding] = useState(false)
    const [busca, setBusca] = useState('')
    const [resultados, setResultados] = useState<any[]>([])
    const [musicaSelecionada, setMusicaSelecionada] = useState<any | null>(null)
    const [tom, setTom] = useState('')
    const [erro, setErro] = useState('')

    // Estados Holyrics & Logs
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncLogs, setSyncLogs] = useState<{ id: number, time: string, msg: string, type: string }[]>([])
    const [isSendingToHolyrics, setIsSendingToHolyrics] = useState(false)
    const [holyricsMsg, setHolyricsMsg] = useState({ text: '', type: '' })

    const dragItem = useRef<number | null>(null)
    const dragOverItem = useRef<number | null>(null)

    useEffect(() => {
        setLista([...repertorioInical].sort((a, b) => a.ordem - b.ordem))
    }, [repertorioInical])

    // Função auxiliar para adicionar logs
    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setSyncLogs(prev => [...prev, { id: Date.now() + Math.random(), time, msg, type }])
    }

    // --- 1. SINCRONIZAR O ACERVO DO HOLYRICS EM LOTES ---
    const handleSyncAcervo = async () => {
        const ip = localStorage.getItem('holyrics_ip')
        const token = localStorage.getItem('holyrics_token')

        if (!ip || !token) {
            alert('Conecte ao Holyrics primeiro no menu Ferramentas.')
            return
        }

        setIsSyncing(true)
        setSyncLogs([]) // Limpa logs anteriores
        addLog('A conectar ao Holyrics...', 'info')

        try {
            const res = await fetch(`${ip.replace(/\/$/, '')}/api/SearchSong?token=${token}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: "" })
            })
            const json = await res.json()

            if (json.status === 'ok' && json.data) {
                const total = json.data.length
                addLog(`Encontradas ${total} músicas. Iniciando download...`, 'info')

                // Define o tamanho do lote (Chunk)
                const chunkSize = 100
                let totalInseridas = 0
                let totalAtualizadas = 0

                // Loop para processar 100 músicas de cada vez
                for (let i = 0; i < total; i += chunkSize) {
                    const chunk = json.data.slice(i, i + chunkSize)
                    addLog(`A processar lote ${Math.floor(i / chunkSize) + 1} de ${Math.ceil(total / chunkSize)}...`, 'info')

                    const syncRes = await sincronizarAcervoLocal(chunk)

                    if (syncRes.success) {
                        totalInseridas += syncRes.inseridas || 0
                        totalAtualizadas += syncRes.atualizadas || 0
                    } else {
                        throw new Error(syncRes.error)
                    }
                }

                addLog(`Concluído! ${totalInseridas} músicas novas registadas.`, 'success')
                addLog(`${totalAtualizadas} músicas atualizadas com sucesso.`, 'success')
            }
        } catch (error: any) {
            addLog(`Falha crítica: ${error.message || 'Erro na conexão.'}`, 'error')
        } finally {
            setIsSyncing(false)
        }
    }

    // --- 2. BUSCAR NO BANCO LOCAL ---
    const handleBuscarLocal = async () => {
        if (!busca.trim()) return
        startTransition(async () => {
            const res = await buscarMusicasLocalmente(busca)
            if (res.success && res.data) setResultados(res.data)
        })
    }

    // --- 3. ADICIONAR NA ESCALA ---
    const handleAdd = async () => {
        if (!musicaSelecionada || !tom.trim()) return setErro('Selecione uma música e informe o tom!')
        setErro('')
        startTransition(async () => {
            const res = await adicionarMusicaLocalAoEvento(eventoId, musicaSelecionada.id, tom)
            if (res.success) {
                setBusca(''); setResultados([]); setMusicaSelecionada(null); setTom(''); setIsAdding(false);
                router.refresh()
            } else {
                setErro(res.error || 'Erro ao adicionar música.')
            }
        })
    }

    // --- 4. ENVIAR PARA O TELÃO ---
    const enviarParaHolyrics = async () => {
        if (lista.length === 0) return;
        const ip = localStorage.getItem('holyrics_ip'); const token = localStorage.getItem('holyrics_token');
        if (!ip || !token) { setHolyricsMsg({ text: '⚠️ Conecte-se ao Holyrics no menu Ferramentas.', type: 'error' }); setTimeout(() => setHolyricsMsg({ text: '', type: '' }), 4000); return; }

        setIsSendingToHolyrics(true)
        const idsParaHolyrics = lista.map(item => item.musica.holyrics_id).filter(id => id !== null)

        if (idsParaHolyrics.length === 0) {
            setHolyricsMsg({ text: '⚠️ Músicas não estão vinculadas ao Holyrics. Sincronize.', type: 'error' })
            setIsSendingToHolyrics(false); setTimeout(() => setHolyricsMsg({ text: '', type: '' }), 4000); return;
        }

        try {
            const res = await fetch(`${ip.replace(/\/$/, '')}/api/AddSongsToPlaylist?token=${token}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idsParaHolyrics })
            })
            if (res.ok) setHolyricsMsg({ text: `✅ Lista enviada para o telão!`, type: 'success' })
            else setHolyricsMsg({ text: '❌ O Holyrics recusou o pedido.', type: 'error' })
        } catch (error) {
            setHolyricsMsg({ text: '❌ Sem conexão com o computador da Mídia.', type: 'error' })
        } finally {
            setIsSendingToHolyrics(false); setTimeout(() => setHolyricsMsg({ text: '', type: '' }), 5000);
        }
    }

    // --- ARRASTAR E SOLTAR / REMOVER ---
    const handleDrop = async () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        let _lista = [...lista];
        const draggedItemContent = _lista.splice(dragItem.current, 1)[0];
        _lista.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null; dragOverItem.current = null;
        setLista(_lista);
        const payload = _lista.map((item, index) => ({ id: item.id, ordem: index + 1 }));
        startTransition(async () => { await atualizarOrdemRepertorio(payload); });
    }

    const handleDelete = (id: string) => {
        if (!confirm('Remover esta música da lista?')) return;
        startTransition(async () => { await removerMusicaDoRepertorio(id); router.refresh() });
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group relative w-full overflow-hidden rounded-[2rem] border border-soft bg-bg2 p-1 transition-all hover:border-figueira/40 hover:shadow-xl hover:shadow-figueira/5 active:scale-[0.98]"
            >
                {/* Efeito de brilho de fundo no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-figueira/0 via-figueira/5 to-figueira/0 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative flex items-center justify-between bg-bg rounded-[1.75rem] p-3 sm:p-4 border border-transparent group-hover:border-soft/50 transition-all">
                    <div className="flex items-center gap-4">
                        {/* Ícone com Badge de Quantidade */}
                        <div className="relative shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-figueira/10 text-figueira shadow-inner transition-all group-hover:bg-figueira group-hover:text-white group-hover:rotate-6">
                                <ListMusic size={22} strokeWidth={2.5} />
                            </div>
                            {lista.length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-fg text-[9px] font-black text-bg shadow-lg border-2 border-bg transition-transform group-hover:scale-110">
                                    {lista.length}
                                </span>
                            )}
                        </div>

                        <div className="text-left">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-muted group-hover:text-figueira transition-colors">
                                Setlist & Tons
                            </h4>
                            <h3 className="text-sm font-black italic uppercase tracking-tighter text-fg">
                                Repertório
                            </h3>
                        </div>
                    </div>

                    {/* Ícone de Ação Minimalista (Seta) */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft/30 text-muted transition-all group-hover:bg-figueira group-hover:text-white group-hover:translate-x-1 shadow-sm shrink-0">
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </div>
            </button>

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-bg border border-soft rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                            {holyricsMsg.text && (
                                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-in slide-in-from-top-4 flex items-center gap-2 ${holyricsMsg.type === 'error' ? 'bg-red-500 text-white' : holyricsMsg.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                                    {holyricsMsg.text}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-b border-soft bg-bg2 shrink-0">
                                <div className="flex items-center gap-3">
                                    <ListMusic size={24} className="text-figueira" />
                                    <div>
                                        <h2 className="text-lg font-black uppercase italic tracking-tighter text-fg leading-none">Repertório</h2>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Lista de músicas do culto</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {podeEditar && lista.length > 0 && (
                                        <button onClick={enviarParaHolyrics} disabled={isSendingToHolyrics} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50" title="Sincronizar Playlist no Telão">
                                            {isSendingToHolyrics ? <Loader2 size={16} className="animate-spin" /> : <MonitorUp size={16} />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">Enviar p/ Holyrics</span>
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-soft/20 rounded-full flex items-center justify-center text-muted hover:bg-red-500 hover:text-white transition-all active:scale-95"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">

                                {/* BLOCO DE SINCRONIZAÇÃO COM LOGS */}
                                {podeEditar && (
                                    <div className="bg-soft/10 border border-soft rounded-2xl p-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <RefreshCcw size={14} className="text-muted" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-fg">Acervo Local</span>
                                            </div>
                                            <button onClick={handleSyncAcervo} disabled={isSyncing} className="flex items-center gap-2 bg-bg border border-soft text-[9px] font-black uppercase tracking-widest text-muted hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50">
                                                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : 'Sincronizar Base'}
                                            </button>
                                        </div>

                                        {/* TERMINAL DE LOGS VISUAL */}
                                        {syncLogs.length > 0 && (
                                            <div className="mt-4 p-3 bg-black/90 rounded-xl h-32 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-hide animate-in fade-in">
                                                {syncLogs.map((log) => (
                                                    <div key={log.id} className="flex gap-2 border-b border-white/5 pb-1">
                                                        <span className="text-white/30 shrink-0">[{log.time}]</span>
                                                        <span className={log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}>
                                                            {log.msg}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* RESTO DO MODAL: FORMULÁRIO DE ADICIONAR E LISTA */}
                                {podeEditar && (
                                    <div className="mb-6">
                                        {!isAdding ? (
                                            <button onClick={() => setIsAdding(true)} className="w-full py-4 border-2 border-dashed border-soft hover:border-figueira/50 rounded-2xl flex items-center justify-center gap-2 text-muted hover:text-figueira transition-colors text-[10px] font-black uppercase tracking-widest">
                                                <Plus size={16} /> Buscar Música do Acervo
                                            </button>
                                        ) : (
                                            <div className="p-5 bg-bg2 border border-soft rounded-2xl space-y-4 animate-in slide-in-from-top-2 relative overflow-hidden">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[11px] font-black text-fg uppercase tracking-widest">Adicionar da Base</h4>
                                                    <button onClick={() => setIsAdding(false)} className="text-muted hover:text-red-500"><X size={16} /></button>
                                                </div>

                                                {!musicaSelecionada ? (
                                                    <>
                                                        <div className="flex gap-2 mb-4">
                                                            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuscarLocal()} className="flex-1 bg-bg border border-soft rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-figueira" placeholder="Pesquise por nome ou artista..." />
                                                            <button onClick={handleBuscarLocal} disabled={isPending || !busca} className="bg-figueira text-white px-4 rounded-xl hover:bg-figueira/90 transition-all disabled:opacity-50">
                                                                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                                            </button>
                                                        </div>
                                                        {resultados.length > 0 && (
                                                            <div className="max-h-40 overflow-y-auto bg-bg border border-soft rounded-xl p-1 shadow-inner">
                                                                {resultados.map(m => (
                                                                    <button key={m.id} onClick={() => setMusicaSelecionada(m)} className="w-full text-left p-3 hover:bg-soft/30 rounded-lg transition-colors flex justify-between items-center group">
                                                                        <div>
                                                                            <span className="text-xs font-black text-fg group-hover:text-figueira block">{m.titulo}</span>
                                                                            {m.artista && <span className="text-[9px] font-bold text-muted uppercase">{m.artista}</span>}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="space-y-4 animate-in slide-in-from-right-2">
                                                        <div className="p-3 bg-soft/10 border border-soft rounded-xl flex justify-between items-center">
                                                            <div><p className="text-[9px] text-muted font-bold uppercase tracking-widest">Selecionada</p><h4 className="text-sm font-black text-fg">{musicaSelecionada.titulo}</h4></div>
                                                            <button onClick={() => setMusicaSelecionada(null)} className="text-[9px] text-figueira uppercase font-black underline">Trocar</button>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 block">Tom Escolhido *</label>
                                                            <input type="text" value={tom} onChange={(e) => setTom(e.target.value.toUpperCase())} maxLength={5} className="w-full bg-bg border border-soft rounded-xl px-3 py-3 text-sm font-black outline-none focus:border-figueira uppercase text-center" placeholder="Ex: G, C#m" />
                                                        </div>
                                                        {erro && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{erro}</p>}
                                                        <button onClick={handleAdd} disabled={isPending || !tom} className="w-full bg-figueira hover:bg-figueira/90 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                                                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Adicionar à Escala
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {lista.length === 0 ? (
                                    <div className="py-10 text-center opacity-50">
                                        <Music size={32} className="mx-auto mb-3 text-muted" />
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Nenhuma música na escala ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 relative">
                                        {isPending && <div className="absolute inset-0 bg-bg/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center"><Loader2 size={24} className="animate-spin text-figueira" /></div>}
                                        {lista.map((item, index) => (
                                            <div key={item.id} draggable={podeEditar} onDragStart={(e) => (dragItem.current = index)} onDragEnter={(e) => (dragOverItem.current = index)} onDragEnd={handleDrop} onDragOver={(e) => e.preventDefault()} className={`group flex items-center justify-between p-3 sm:p-4 bg-bg border border-soft rounded-2xl transition-all shadow-sm ${podeEditar ? 'hover:border-figueira/50 cursor-grab active:cursor-grabbing' : ''}`}>
                                                <div className="flex items-center gap-3 sm:gap-4 truncate">
                                                    {podeEditar && <div className="text-muted/30 group-hover:text-muted transition-colors hidden sm:block"><GripVertical size={18} /></div>}
                                                    <span className="text-[10px] font-black text-muted bg-soft w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg shrink-0">{index + 1}</span>
                                                    <div className="truncate">
                                                        <h4 className="text-xs sm:text-sm font-black text-fg uppercase italic tracking-tight truncate group-hover:text-figueira transition-colors">{item.musica.titulo}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Hash size={10} /> {item.tom_tocado}</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2 shrink-0 pl-2">
                                                    {item.musica.link_video && <Link href={item.musica.link_video} target="_blank" className="p-2 sm:p-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors active:scale-95"><Youtube size={16} /></Link>}
                                                    {podeEditar && <button onClick={() => handleDelete(item.id)} className="p-2 sm:p-2.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}