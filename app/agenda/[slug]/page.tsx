// app/agenda/[slug]/page.tsx
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin } from 'lucide-react'
import AgendamentoPublico from '@/components/agenda/AgendamentoPublico'

export const dynamic = 'force-dynamic'

export default async function AgendaPublicaPage({ params }: { params: { slug: string } }) {
    // 1. Busca a agenda pelo Link (slug)
    const agenda = await prisma.agenda.findUnique({
        where: { slug: params.slug },
        include: { dono: true }
    });

    // 2. Se não existir ou for privada, devolve erro 404
    if (!agenda || !agenda.is_publica) {
        notFound();
    }

    // 3. Buscar os compromissos futuros para bloquear os horários no calendário
    const compromissosOcupados = await prisma.compromisso.findMany({
        where: {
            agenda_id: agenda.id,
            data_inicio: { gte: new Date() },
            status: 'AGENDADO'
        },
        select: {
            data_inicio: true,
            data_fim: true
        }
    });

    return (
        <main className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-bg2 border border-soft rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-700">
                
                {/* LADO ESQUERDO: INFORMAÇÕES DO PASTOR/LÍDER */}
                <aside className="w-full md:w-1/3 bg-bg border-b md:border-b-0 md:border-r border-soft p-8 md:p-10 flex flex-col items-center md:items-start text-center md:text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-figueira/10 blur-[60px] rounded-full pointer-events-none -mt-10 -mr-10"></div>
                    
                    {agenda.dono.avatar_file ? (
                        <img src={agenda.dono.avatar_file} alt={agenda.dono.first_name} className="w-24 h-24 rounded-[1.5rem] object-cover mb-6 shadow-md border border-soft" />
                    ) : (
                        <div className="w-24 h-24 rounded-[1.5rem] bg-figueira/10 flex items-center justify-center text-figueira mb-6 border border-figueira/20 shadow-sm">
                            <span className="text-3xl font-black">{agenda.dono.first_name[0]}</span>
                        </div>
                    )}
                    
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] mb-2">Agenda Oficial</span>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-fg leading-none mb-3">
                        {agenda.nome}
                    </h1>
                    <p className="text-[11px] font-medium text-muted mb-8 leading-relaxed">
                        Bem-vindo(a) à minha agenda digital. Escolha o motivo e o melhor horário para o nosso encontro.
                    </p>

                    <div className="mt-auto space-y-3 w-full">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                            <CalendarDays size={14} className="text-figueira" /> Duração: ~45 min
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                            <MapPin size={14} className="text-figueira" /> Presencial (Igreja)
                        </div>
                    </div>
                </aside>

                {/* LADO DIREITO: O COMPONENTE DE MARCAÇÃO INTERATIVO */}
                <section className="w-full md:w-2/3 bg-bg2 p-8 md:p-10">
                    <AgendamentoPublico 
                        agendaId={agenda.id} 
                        compromissosOcupados={compromissosOcupados} 
                    />
                </section>
                
            </div>
        </main>
    )
}