'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
    CalendarOff, Users, MessageSquare, Car, Coffee,
    Calendar, CalendarDays, ChevronDown, ChevronUp, BookOpen, Clock, ChevronRight, MessageCircle, X
} from 'lucide-react'
import { createPortal } from 'react-dom'

import QrCodeModal from '@/components/membros/QrCodeModal'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import BotoesEscala from '@/components/membros/BotoesEscala'
import CardDepartamentoMembro from '@/components/membros/CardDepartamentoMembro'

interface EscalaItem {
    id: number
    ids: number[]
    funcoes: string[]
    confirmado: boolean
    motivo_recusa: string | null
    horario: string | null
    evento: { id: number; nome: string; data: string }
    departamento: { id: number; nome: string }
}

interface EventoItem {
    id: number
    nome: string
    data: string
}

interface Props {
    membro: any
    escalas: EscalaItem[]
    departamentos: any[]
    membroId: number
    role: string
    proximosEventos?: EventoItem[]
}

export default function MobileDashboard({ membro, escalas, departamentos, membroId, role, proximosEventos = [] }: Props) {
    const [escalasAberto, setEscalasAberto] = useState(false)
    const [deptosAberto, setDeptosAberto] = useState(false)
    const [agendaAberta, setAgendaAberta] = useState(false)
    const [mostrarTodosEventos, setMostrarTodosEventos] = useState(false)
    const deptosRef = useRef<HTMLDivElement>(null)

    const nomeCompleto = `${membro.first_name} ${membro.last_name || ''}`.trim()

    // Versículo do dia — roda entre versículos com base no dia do ano
    const versiculos = [
        { texto: 'Porque onde estiverem dois ou três reunidos em meu nome, ali eu estou no meio deles.', ref: 'Mateus 18:20' },
        { texto: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
        { texto: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
        { texto: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.', ref: 'Provérbios 3:5' },
        { texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', ref: 'Salmos 27:1' },
        { texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito.', ref: 'João 3:16' },
        { texto: 'Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.', ref: 'Mateus 6:33' },
        { texto: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.', ref: 'Isaías 41:10' },
        { texto: 'E conhecereis a verdade, e a verdade vos libertará.', ref: 'João 8:32' },
        { texto: 'Mas os que esperam no Senhor renovarão as suas forças.', ref: 'Isaías 40:31' },
        { texto: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', ref: 'Salmos 119:105' },
        { texto: 'Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos!', ref: 'Filipenses 4:4' },
        { texto: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', ref: 'Salmos 46:1' },
        { texto: 'Eu sou o caminho, a verdade e a vida.', ref: 'João 14:6' },
        { texto: 'Tudo o que fizerem, façam de todo o coração, como para o Senhor.', ref: 'Colossenses 3:23' },
        { texto: 'Porque os meus pensamentos não são os vossos pensamentos.', ref: 'Isaías 55:8' },
        { texto: 'O amor é paciente, o amor é bondoso.', ref: '1 Coríntios 13:4' },
        { texto: 'Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes.', ref: 'Jeremias 33:3' },
        { texto: 'O Senhor é bom, um refúgio no dia da angústia.', ref: 'Naum 1:7' },
        { texto: 'Em tudo dai graças, porque esta é a vontade de Deus.', ref: '1 Tessalonicenses 5:18' },
        { texto: 'Não vos inquieteis por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus.', ref: 'Filipenses 4:6' },
        { texto: 'Sede fortes e corajosos. Não temais, nem vos espanteis.', ref: 'Deuteronómio 31:6' },
        { texto: 'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz.', ref: 'Jeremias 29:11' },
        { texto: 'Grande é o Senhor e muito digno de louvor.', ref: 'Salmos 145:3' },
        { texto: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.', ref: 'Mateus 11:28' },
        { texto: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Omnipotente descansará.', ref: 'Salmos 91:1' },
        { texto: 'Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei.', ref: 'Apocalipse 3:20' },
        { texto: 'Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.', ref: 'Mateus 5:9' },
        { texto: 'A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.', ref: 'Hebreus 11:1' },
        { texto: 'Todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.', ref: 'Romanos 8:28' },
        { texto: 'O Senhor é fiel; ele vos fortalecerá e vos guardará do maligno.', ref: '2 Tessalonicenses 3:3' },
    ]
    const diaDoAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const versiculoHoje = versiculos[diaDoAno % versiculos.length]

    const gridBtnClass = "bg-bg2 border border-soft rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-all"

    function scrollToDeptos() {
        setDeptosAberto(true)
        setTimeout(() => {
            deptosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    return (
        <div className="space-y-5 px-4 pt-16 pb-28 animate-in fade-in duration-500">

            {/* ── VERSÍCULO DO DIA + QR CODE ────────────── */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <BookOpen size={10} className="text-figueira shrink-0" />
                        <p className="text-[7px] font-black uppercase tracking-widest text-figueira">Versículo do Dia</p>
                    </div>
                    <p className="text-[11px] text-fg/80 italic leading-snug line-clamp-2">
                        &ldquo;{versiculoHoje.texto}&rdquo;
                    </p>
                    <p className="text-[7px] font-bold text-muted uppercase tracking-widest">{versiculoHoje.ref}</p>
                </div>
                <QrCodeModal
                    membroId={membro.id}
                    qrCode={membro.qr_code || null}
                    membroNome={nomeCompleto}
                />
            </div>

            {/* ── GRID 6 BOTÕES ──────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                <ModalIndisponibilidade trigger={
                    <div className={gridBtnClass}>
                        <CalendarOff size={22} className="text-orange-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Indisponibilidade</span>
                    </div>
                } />

                {/* 2 - Onde Eu Sirvo → scroll para secção inline */}
                <button onClick={scrollToDeptos}>
                    <div className={gridBtnClass}>
                        <Users size={22} className="text-figueira" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Onde Eu Sirvo</span>
                    </div>
                </button>

                <Link href="/membros/mural">
                    <div className={gridBtnClass}>
                        <MessageSquare size={22} className="text-blue-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Mural</span>
                    </div>
                </Link>

                <Link href="/boleia">
                    <div className={gridBtnClass}>
                        <Car size={22} className="text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Boleia</span>
                    </div>
                </Link>

                <button onClick={() => setAgendaAberta(true)}>
                    <div className={gridBtnClass}>
                        <Calendar size={22} className="text-blue-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Agenda</span>
                    </div>
                </button>

                <Link href="/cantina/menu-local">
                    <div className={gridBtnClass}>
                        <Coffee size={22} className="text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Cantina</span>
                    </div>
                </Link>

            </div>

            {/* ── CARD COLAPSÁVEL: MINHAS ESCALAS ────────── */}
            <div className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <button
                    onClick={() => setEscalasAberto(!escalasAberto)}
                    className="w-full flex items-center justify-between p-4"
                >
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-fg flex items-center gap-2">
                        <CalendarDays size={14} className="text-figueira" />
                        Minhas Escalas
                        {escalas.length > 0 && (
                            <span className="bg-figueira/10 text-figueira text-[8px] font-black px-2 py-0.5 rounded-lg">
                                {escalas.length}
                            </span>
                        )}
                    </h3>
                    {escalasAberto ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                </button>

                {escalasAberto && (
                    <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200 border-t border-soft pt-3">
                        {escalas.length > 0 ? (
                            escalas.map((esc) => {
                                const statusBadge = esc.motivo_recusa
                                    ? { label: 'Indisponivel', cor: 'bg-red-500/10 text-red-500 border-red-500/20' }
                                    : esc.confirmado
                                        ? { label: 'Confirmado', cor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
                                        : { label: 'Pendente', cor: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }

                                return (
                                    <div key={esc.id} className={`border rounded-xl p-3 space-y-2 ${esc.confirmado ? 'border-emerald-500/20' : 'border-soft'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg text-center shrink-0 min-w-[40px] ${esc.confirmado ? 'bg-emerald-500 text-white' : 'bg-fg text-bg'}`}>
                                                <span className="block text-[6px] font-black uppercase opacity-70">
                                                    {new Date(esc.evento.data).toLocaleDateString('pt-PT', { month: 'short' })}
                                                </span>
                                                <span className="text-base block font-black italic leading-tight">
                                                    {new Date(esc.evento.data).toLocaleDateString('pt-PT', { day: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black uppercase italic text-fg text-[10px] truncate">{esc.evento.nome}</h5>
                                                <span className="text-[7px] font-bold text-figueira uppercase tracking-widest">{esc.departamento.nome}</span>
                                                {esc.funcoes?.filter(Boolean).length > 0 && (
                                                    <p className="text-[7px] text-muted mt-0.5">{esc.funcoes.join(' · ')}</p>
                                                )}
                                            </div>
                                            <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border shrink-0 ${statusBadge.cor}`}>
                                                {statusBadge.label}
                                            </span>
                                        </div>
                                        <BotoesEscala
                                            escalaIds={esc.ids}
                                            confirmado={esc.confirmado}
                                            motivoRecusa={esc.motivo_recusa ?? null}
                                            colapsado
                                        />
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted text-center py-4">
                                Sem escalas agendadas
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ── CARD COLAPSÁVEL: ONDE EU SIRVO ─────────── */}
            <div ref={deptosRef} className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <button
                    onClick={() => setDeptosAberto(!deptosAberto)}
                    className="w-full flex items-center justify-between p-4"
                >
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-fg flex items-center gap-2">
                        <Users size={14} className="text-figueira" />
                        Onde Eu Sirvo
                        {departamentos.length > 0 && (
                            <span className="bg-figueira/10 text-figueira text-[8px] font-black px-2 py-0.5 rounded-lg">
                                {departamentos.length}
                            </span>
                        )}
                    </h3>
                    {deptosAberto ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                </button>

                {deptosAberto && (
                    <div className="px-3 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200 border-t border-soft pt-3">
                        {departamentos.length > 0 ? (
                            departamentos.map((depto: any) => (
                                <CardDepartamentoMembro
                                    key={depto.id}
                                    depto={depto}
                                    membroId={membroId}
                                    role={role}
                                    podeGerirEscalas={depto.pode_gerir_escalas}
                                />
                            ))
                        ) : (
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted text-center py-4">
                                Ainda nao fazes parte de nenhum departamento
                            </p>
                        )}
                    </div>
                )}
            </div>
            {/* ── MODAL AGENDA ─────────────────────────── */}
            {agendaAberta && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => { setAgendaAberta(false); setMostrarTodosEventos(false) }}
                >
                    <div
                        className="bg-bg w-full max-w-md rounded-t-[2rem] border-t border-soft shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-soft shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-figueira/10 text-figueira flex items-center justify-center">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">Agenda</h3>
                                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest">{proximosEventos.length} eventos</p>
                                </div>
                            </div>
                            <button onClick={() => { setAgendaAberta(false); setMostrarTodosEventos(false) }}
                                className="w-8 h-8 flex items-center justify-center bg-soft text-muted hover:text-fg rounded-xl transition-all">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {(mostrarTodosEventos ? proximosEventos : proximosEventos.slice(0, 4)).map((evento) => {
                                const d = new Date(evento.data)
                                const dia = d.toLocaleDateString('pt-PT', { day: '2-digit' })
                                const mes = d.toLocaleDateString('pt-PT', { month: 'short' })
                                const diaSemana = d.toLocaleDateString('pt-PT', { weekday: 'short' })
                                const hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                                const dataCompleta = d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                                const dataCapitalizada = dataCompleta.charAt(0).toUpperCase() + dataCompleta.slice(1)

                                return (
                                    <details key={evento.id} className="bg-bg2 border border-soft rounded-xl overflow-hidden group/ev">
                                        <summary className="flex items-center gap-3 p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                                            <div className="p-2 rounded-lg bg-fg text-bg text-center min-w-[44px] shrink-0">
                                                <span className="block text-[7px] font-black uppercase opacity-60">{mes}</span>
                                                <span className="block text-lg font-black italic leading-tight">{dia}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[11px] font-black uppercase italic text-fg truncate">{evento.nome}</h4>
                                                <p className="text-[9px] text-muted font-bold mt-0.5">{diaSemana} · {hora}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-muted shrink-0 transition-transform group-open/ev:rotate-90" />
                                        </summary>
                                        <div className="px-3 pb-3 pt-1 border-t border-soft space-y-3 animate-in fade-in duration-200">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-[10px] text-fg font-medium">
                                                    <Calendar size={11} className="text-figueira shrink-0" /> {dataCapitalizada}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted">
                                                    <Clock size={11} className="shrink-0" /> {hora}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const texto = `⛪ *${evento.nome.toUpperCase()}*\n📅 ${dataCapitalizada}\n⏰ ${hora}\n\n🙏 Vemo-nos lá!`
                                                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank')
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                            >
                                                <MessageCircle size={13} /> Partilhar no WhatsApp
                                            </button>
                                        </div>
                                    </details>
                                )
                            })}
                            {proximosEventos.length === 0 && (
                                <div className="text-center py-8">
                                    <Calendar size={28} className="mx-auto text-muted/20 mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Sem eventos agendados</p>
                                </div>
                            )}
                            {proximosEventos.length > 4 && (
                                <button onClick={() => setMostrarTodosEventos(!mostrarTodosEventos)}
                                    className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-figueira hover:text-fg transition-colors flex items-center justify-center gap-1.5">
                                    <ChevronDown size={12} className={`transition-transform ${mostrarTodosEventos ? 'rotate-180' : ''}`} />
                                    {mostrarTodosEventos ? 'Ver menos' : `Ver todos (${proximosEventos.length})`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
