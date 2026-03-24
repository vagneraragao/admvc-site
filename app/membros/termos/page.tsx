import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import { ShieldCheck, Anchor, Fingerprint, CheckCircle2 } from 'lucide-react'
import BotaoAssinar from '@/components/BotaoAssinar'

export default async function TermosPage() {
    const session = await getSessionData();
    if (!session) redirect('/membros/login');

    const membroId = session.membroId;

    const membro = await prisma.membro.findUnique({
        where: { id: membroId },
        select: { first_name: true, last_name: true, termo_aceite: true }
    });

    if (!membro) redirect('/membros/login');
    if (membro.termo_aceite) redirect('/membros/dashboard');

    return (
        <main className="max-w-4xl mx-auto py-16 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-figueira/10 rounded-full text-figueira">
                    <ShieldCheck size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Central de Assinaturas</span>
                </div>
                <h1 className="text-6xl font-black italic uppercase tracking-tighter text-fg leading-none">
                    Aceite <span className="text-muted">&</span> Compromisso
                </h1>
            </header>

            <div className="grid gap-8">

                {/* BLOCO 1: DOCUMENTO PERMANECER */}
                <section className="bg-bg border border-soft rounded-[3rem] p-10 md:p-12 shadow-xl relative overflow-hidden group">
                    <Anchor className="absolute -right-6 -top-6 w-32 h-32 text-figueira/5 -rotate-12 transition-transform group-hover:rotate-0 duration-700" />

                    <div className="relative space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-figueira text-white rounded-xl flex items-center justify-center">
                                <Anchor size={20} />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic text-fg">Documento: Permanecer</h2>
                        </div>

                        <div className="prose prose-sm text-muted font-medium leading-relaxed">
                            <p>
                                O compromisso <strong>Permanecer</strong> representa a minha decisão voluntária de estar plantado nesta comunidade local. Ao aceitar, declaro que:
                            </p>
                            <ul className="space-y-3 mt-4">
                                {[
                                    'Compreendo e partilho da visão e valores da igreja.',
                                    'Comprometo-me a servir conforme os dons e escalas estabelecidas.',
                                    'Submeto-me à mentoria e ao cuidado da liderança espiritual.',
                                    'Zelarei pela unidade e paz do corpo de membros.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[10px] font-bold uppercase text-fg leading-tight">
                                        <CheckCircle2 size={14} className="text-figueira shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* BLOCO 2: GDPR (DADOS PESSOAIS) */}
                <section className="bg-bg2 border border-soft rounded-[3rem] p-10 md:p-12 shadow-sm relative overflow-hidden group">
                    <Fingerprint className="absolute -right-6 -top-6 w-32 h-32 text-muted/5 rotate-12" />

                    <div className="relative space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-fg text-bg rounded-xl flex items-center justify-center">
                                <Fingerprint size={20} />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic text-fg">Documento: GDPR</h2>
                        </div>

                        <div className="prose prose-sm text-muted font-medium leading-relaxed">
                            <p>
                                De acordo com o Regulamento Geral sobre a Proteção de Dados (GDPR), autorizo o tratamento dos meus dados para:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-bg rounded-2xl border border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                    <span className="text-fg block mb-1">Gestão Interna</span>
                                    Cadastro, escalas e aniversários.
                                </div>
                                <div className="p-4 bg-bg rounded-2xl border border-soft text-[9px] font-black uppercase tracking-widest text-muted">
                                    <span className="text-fg block mb-1">Comunicação</span>
                                    Envio de avisos via WhatsApp e E-mail.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* BOTÃO FINAL DE ACEITE DUPLO */}
            <div className="max-w-2xl mx-auto pt-6 pb-20 space-y-6">
                <div className="p-6 bg-bg border-2 border-dashed border-soft rounded-[2rem] text-center">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                        Ao clicar no botão abaixo, eu, <span className="text-fg font-black">{membro.first_name} {membro.last_name}</span>, assino digitalmente os documentos <span className="text-figueira font-black">PERMANECER</span> e <span className="text-figueira font-black">GDPR</span>.
                    </p>
                </div>

                <BotaoAssinar membroId={membroId} />

                <p className="text-[8px] text-center text-muted uppercase font-black tracking-[0.3em]">
                    Identificador Digital Único: MEMB_AUTH_{membroId}
                </p>
            </div>
        </main>
    )
}