// app/boleia/page.tsx
// Pagina principal — listar boleias disponiveis para os proximos eventos
import { getDb } from '@/lib/db'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Car, MapPin, Clock, Users, Plus, ChevronRight, Calendar } from 'lucide-react'
import BotaoReservar from '@/components/boleia/BotaoReservar'
import BotaoCancelarReserva from '@/components/boleia/BotaoCancelarReserva'

export const dynamic = 'force-dynamic'

export default async function BoleiaPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')
    const { membroId } = session

    const db = await getDb()

    // Proximos eventos (7 dias)
    const agora = new Date()
    const emSeteDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [ofertas, proximosEventos] = await Promise.all([
        db.boleiaOferta.findMany({
            where: {
                status: 'ATIVA',
                data_hora_saida: { gte: agora },
            },
            include: {
                motorista: { select: { id: true, first_name: true, last_name: true } },
                evento: { select: { id: true, nome: true, data: true } },
                reservas: {
                    where: { status: 'CONFIRMADA' },
                    include: { passageiro: { select: { id: true, first_name: true, last_name: true } } },
                },
            },
            orderBy: { data_hora_saida: 'asc' },
        }),
        db.evento.findMany({
            where: { data: { gte: agora, lte: emSeteDias } },
            orderBy: { data: 'asc' },
            take: 10,
        }),
    ])

    return (
        <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-10 pb-24 animate-in fade-in duration-700">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-soft">
                <div>
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                        <Car size={14} /> Boleia Solidaria
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Boleias <span className="text-muted/20">Disponiveis.</span>
                    </h1>
                    <p className="text-sm text-muted font-medium max-w-lg mt-3 leading-relaxed">
                        Encontre uma boleia para o proximo culto ou ofereca lugar no seu carro.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/boleia/oferecer"
                        className="inline-flex items-center gap-2 bg-figueira text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all shadow-lg shadow-figueira/20 active:scale-95"
                    >
                        <Plus size={14} /> Oferecer Boleia
                    </Link>
                    <Link
                        href="/boleia/minhas"
                        className="inline-flex items-center gap-2 bg-bg2 border border-soft text-fg px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-soft transition-all active:scale-95"
                    >
                        As Minhas
                    </Link>
                </div>
            </header>

            {/* STATS */}
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <p className="text-2xl font-black italic text-fg">{ofertas.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Boleias Ativas</p>
                </div>
                <div className="w-px h-8 bg-soft" />
                <div className="text-center">
                    <p className="text-2xl font-black italic text-fg">
                        {ofertas.reduce((sum, o) => sum + Math.max(0, o.vagas_total - o.reservas.length), 0)}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Lugares Livres</p>
                </div>
                <div className="w-px h-8 bg-soft" />
                <div className="text-center">
                    <p className="text-2xl font-black italic text-fg">{proximosEventos.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Eventos Proximos</p>
                </div>
            </div>

            {/* LISTA DE OFERTAS */}
            {ofertas.length > 0 ? (
                <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ofertas.map((oferta) => {
                        const vagasLivres = oferta.vagas_total - oferta.reservas.length
                        const minhaReserva = oferta.reservas.find(r => r.passageiro.id === membroId)
                        const souMotorista = oferta.motorista.id === membroId
                        const dataFormatada = new Date(oferta.data_hora_saida).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
                        const horaFormatada = new Date(oferta.data_hora_saida).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

                        return (
                            <div key={oferta.id} className="bg-bg2 border border-soft rounded-[2rem] overflow-hidden hover:border-figueira/20 transition-all shadow-sm">
                                {/* Barra de cor */}
                                <div className={`h-1.5 ${vagasLivres > 0 ? 'bg-figueira' : 'bg-soft'}`} />

                                <div className="p-6 space-y-4">
                                    {/* Motorista */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-figueira/10 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-figueira">
                                                {oferta.motorista.first_name[0]}{oferta.motorista.last_name[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase text-fg leading-none">
                                                {oferta.motorista.first_name} {oferta.motorista.last_name}
                                            </p>
                                            {souMotorista && (
                                                <span className="text-[8px] font-black uppercase text-figueira tracking-widest">Voce</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalhes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] text-fg font-medium">
                                            <Clock size={12} className="text-figueira shrink-0" />
                                            {dataFormatada} as {horaFormatada}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-muted">
                                            <MapPin size={12} className="shrink-0" />
                                            {oferta.zona_partida || oferta.endereco_partida}
                                        </div>
                                        {oferta.evento && (
                                            <div className="flex items-center gap-2 text-[11px] text-muted">
                                                <Calendar size={12} className="shrink-0" />
                                                {oferta.evento.nome}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[11px] text-muted">
                                            <Users size={12} className="shrink-0" />
                                            {vagasLivres}/{oferta.vagas_total} {vagasLivres === 1 ? 'lugar livre' : 'lugares livres'}
                                        </div>
                                    </div>

                                    {/* Nota */}
                                    {oferta.nota && (
                                        <p className="text-[10px] text-muted italic border-t border-soft pt-3">
                                            &ldquo;{oferta.nota}&rdquo;
                                        </p>
                                    )}

                                    {/* Passageiros */}
                                    {oferta.reservas.length > 0 && (
                                        <div className="flex items-center gap-1 pt-1">
                                            {oferta.reservas.map(r => (
                                                <div key={r.id} className="w-7 h-7 rounded-lg bg-soft flex items-center justify-center" title={`${r.passageiro.first_name} ${r.passageiro.last_name}`}>
                                                    <span className="text-[8px] font-black text-muted">
                                                        {r.passageiro.first_name[0]}{r.passageiro.last_name[0]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Acao */}
                                    <div className="pt-2">
                                        {souMotorista ? (
                                            <Link href="/boleia/minhas" className="text-[9px] font-black uppercase tracking-widest text-figueira hover:text-fg transition-colors flex items-center gap-1">
                                                Gerir <ChevronRight size={12} />
                                            </Link>
                                        ) : minhaReserva ? (
                                            <BotaoCancelarReserva reservaId={minhaReserva.id} />
                                        ) : vagasLivres > 0 ? (
                                            <BotaoReservar ofertaId={oferta.id} />
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Sem vagas</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </section>
            ) : (
                <div className="py-20 text-center">
                    <Car size={32} className="mx-auto text-muted/20 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Nenhuma boleia disponivel de momento
                    </p>
                    <Link href="/boleia/oferecer" className="inline-flex items-center gap-2 mt-4 text-figueira text-[10px] font-black uppercase tracking-widest hover:text-fg transition-colors">
                        <Plus size={12} /> Seja o primeiro a oferecer
                    </Link>
                </div>
            )}
        </main>
    )
}
