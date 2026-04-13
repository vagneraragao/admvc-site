'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    CalendarOff, Users, MessageSquare, Car, Coffee,
    HelpCircle, CalendarDays, ChevronDown, ChevronUp
} from 'lucide-react'

import QrCodeModal from '@/components/membros/QrCodeModal'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import ModalAjuda from '@/components/membros/ModalAjuda'
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

interface Props {
    membro: any
    escalas: EscalaItem[]
    departamentos: any[]
    membroId: number
    role: string
}

export default function MobileDashboard({ membro, escalas, departamentos, membroId, role }: Props) {
    const [escalasAberto, setEscalasAberto] = useState(false)
    const [deptosAberto, setDeptosAberto] = useState(false)
    const deptosRef = useRef<HTMLDivElement>(null)

    const iniciais = `${membro.first_name?.[0] || ''}${membro.last_name?.[0] || ''}`
    const nomeCompleto = `${membro.first_name} ${membro.last_name || ''}`.trim()
    const congregacao = membro.congregacao?.nome || ''

    const gridBtnClass = "bg-bg2 border border-soft rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-all"

    function scrollToDeptos() {
        setDeptosAberto(true)
        setTimeout(() => {
            deptosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    return (
        <div className="space-y-5 px-4 pt-16 pb-28 animate-in fade-in duration-500">

            {/* ── CARD DO MEMBRO ──────────────────────────── */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0">
                    {membro.avatar_file ? (
                        <Image src={membro.avatar_file} alt="" fill sizes="48px" className="rounded-xl object-cover border border-soft" />
                    ) : (
                        <div className="w-full h-full rounded-xl bg-fg text-bg flex items-center justify-center font-black text-sm border border-soft">
                            {iniciais}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-black uppercase italic tracking-tighter text-fg truncate">{nomeCompleto}</h2>
                    {congregacao && (
                        <p className="text-[8px] font-black uppercase tracking-widest text-figueira">{congregacao}</p>
                    )}
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

                <Link href="/cantina/menu-local">
                    <div className={gridBtnClass}>
                        <Coffee size={22} className="text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Cantina</span>
                    </div>
                </Link>

                <ModalAjuda trigger={
                    <div className={gridBtnClass}>
                        <HelpCircle size={22} className="text-muted" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg text-center leading-tight px-1">Ajuda</span>
                    </div>
                } />
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
        </div>
    )
}
