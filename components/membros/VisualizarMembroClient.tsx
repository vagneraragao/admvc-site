"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, ChevronRight, User, MapPin, Church,
    ShieldCheck, Users2, Edit3, CreditCard, Calendar
} from "lucide-react";

export default function VisualizarMembroClient({ membro }: any) {
    const [abaAtiva, setAbaAtiva] = useState(1);

    const departamentos = membro.ministerios?.map((m: any) => m.departamento) || [];
    const grupos = membro.grupos || [];
    const cargos = membro.cargos || [];

    const abas = [
        { id: 1, label: "Perfil", icon: <User size={14} /> },
        { id: 2, label: "Endereço", icon: <MapPin size={14} /> },
        { id: 3, label: "Eclesiástico", icon: <Church size={14} /> },
        { id: 4, label: "Ministérios", icon: <ShieldCheck size={14} /> },
        { id: 5, label: "Família", icon: <Users2 size={14} /> },
    ];

    return (
        <main className="max-w-5xl mx-auto py-10 px-6 space-y-8 animate-in fade-in duration-500">

            {/* BARRA DE HISTÓRICO (BREADCRUMBS) */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/membros" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Lista de Membros
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Ficha do Membro</span>
            </nav>

            {/* CABEÇALHO DO PERFIL (CARD PREMIUM) */}
            <header className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 bg-fg text-bg p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                {/* Efeito Visual de Fundo */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-figueira/20 blur-[100px] -mr-20 -mt-20 rounded-full pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center md:items-center gap-8 relative z-10 w-full">
                    {/* FOTO */}
                    <div className="w-36 h-36 rounded-full border-[6px] border-bg/10 overflow-hidden bg-bg2 shrink-0 shadow-2xl relative">
                        {membro.avatar_file ? (
                            <img src={membro.avatar_file} alt="Foto de Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-bg/30 bg-bg/5">
                                <User size={48} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>

                    {/* DADOS PRINCIPAIS */}
                    <div className="text-center md:text-left space-y-3 flex-1">
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                            <span className="px-3 py-1 bg-figueira text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                {membro.status || 'ATIVO'}
                            </span>
                            <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/10">
                                {membro.role || 'MEMBRO'}
                            </span>
                            {membro.familia && (
                                <span className="px-3 py-1 bg-white/5 text-white/80 text-[9px] font-black uppercase tracking-widest rounded-full italic">
                                    Família {membro.familia.surname}
                                </span>
                            )}
                            <span className="px-3 py-1 bg-transparent text-white/40 text-[9px] font-black uppercase tracking-widest rounded-full">
                                ID #{membro.id}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                            {membro.first_name} <span className="text-figueira">{membro.last_name}</span>
                        </h1>

                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                            <Calendar size={12} />
                            Membro desde {membro.created_at ? new Date(membro.created_at).toLocaleDateString('pt-PT') : '---'}
                        </p>
                    </div>
                    {/* Mostrar a Escolaridade */}
                    <div className="p-4 bg-bg2 rounded-2xl border border-soft">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1">Escolaridade</span>
                        <span className="text-sm font-bold text-fg">
                            {membro.escolaridade?.nome || 'Não informada'}
                        </span>
                    </div>

                    {/* Mostrar Data de Conversão */}
                    <div className="p-4 bg-bg2 rounded-2xl border border-soft">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1">Data de Conversão</span>
                        <span className="text-sm font-bold text-fg">
                            {membro.conversion_date
                                ? new Date(membro.conversion_date).toLocaleDateString('pt-PT')
                                : 'Não informada'}
                        </span>
                    </div>
                    {/* BOTÃO DE AÇÃO */}
                    <div className="relative z-10 shrink-0 w-full md:w-auto">
                        <Link
                            href={`/admin/membros/editar/${membro.id}`}
                            className="flex items-center justify-center gap-2 bg-bg text-fg px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl active:scale-95 w-full"
                        >
                            <Edit3 size={14} /> Editar Ficha
                        </Link>
                    </div>
                </div>
            </header>

            {/* NAVEGAÇÃO POR ABAS */}
            <nav className="flex flex-wrap gap-2 bg-bg2 p-2 rounded-[2.5rem] border border-soft shadow-sm sticky top-4 z-30 backdrop-blur-md">
                {abas.map((aba) => (
                    <button
                        key={aba.id}
                        onClick={() => setAbaAtiva(aba.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${abaAtiva === aba.id ? "bg-fg text-bg shadow-xl scale-[1.02]" : "text-muted hover:bg-soft"
                            }`}
                    >
                        {aba.icon} <span className="hidden sm:inline">{aba.label}</span>
                    </button>
                ))}
            </nav>

            {/* CONTEÚDO DAS ABAS */}
            <div className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm min-h-[450px]">

                {abaAtiva === 1 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                        <InfoGroup label="Nome Completo" value={`${membro.first_name} ${membro.last_name}`} />
                        <InfoGroup label="E-mail" value={membro.email} />
                        <InfoGroup label="Telemóvel / WhatsApp" value={membro.phone_1} />
                        <InfoGroup label="Gênero" value={membro.gender} />
                        <InfoGroup label="Data de Nascimento" value={membro.birthdate ? new Date(membro.birthdate).toLocaleDateString('pt-PT') : '---'} />
                        <InfoGroup label="Estado Civil" value={membro.marital_status} />
                        <InfoGroup label="Profissão" value={membro.profession} />
                        <InfoGroup label="Nome do Pai" value={membro.father_name} />
                        <InfoGroup label="Nome da Mãe" value={membro.mother_name} />
                    </div>
                )}

                {abaAtiva === 2 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="md:col-span-2 lg:col-span-3">
                            <InfoGroup label="Morada Principal" value={membro.address_1} />
                        </div>
                        <InfoGroup label="Número / Porta" value={membro.address_number} />
                        <InfoGroup label="Código Postal" value={membro.postal_code} />
                        <InfoGroup label="Distrito / Bairro" value={membro.neighborhood} />
                        <InfoGroup label="Cidade" value={membro.city || membro.id_city} />
                        <InfoGroup label="País" value={membro.country} />
                    </div>
                )}

                {abaAtiva === 3 && (
                    <div className="grid md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="md:col-span-2 p-6 bg-figueira/5 border border-figueira/20 rounded-3xl flex items-center gap-4">
                            <div className="bg-figueira text-white p-3 rounded-xl"><CreditCard size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-figueira tracking-widest">ID Cantina (Loyverse)</p>
                                <p className="text-sm font-bold text-fg uppercase">{membro.loyverse_id || 'Não Vinculado'}</p>
                            </div>
                        </div>

                        <InfoGroup label="Status de Batismo" value={membro.baptism_status} />
                        <InfoGroup label="Data de Batismo" value={membro.baptism_date ? new Date(membro.baptism_date).toLocaleDateString('pt-PT') : 'Não Consta'} />
                        <InfoGroup label="Data de Admissão" value={membro.admission_date ? new Date(membro.admission_date).toLocaleDateString('pt-PT') : 'Não Consta'} />
                        <InfoGroup label="Cargo Eclesiástico" value={membro.church_role} />

                        <div className="md:col-span-2 bg-white/50 p-8 rounded-[2rem] border border-soft shadow-inner">
                            <InfoGroup label="Observações Pastorais / Notas" value={membro.notes} />
                        </div>
                    </div>
                )}

                {abaAtiva === 4 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                        <ListGroup title="Departamentos Ativos" items={departamentos} icon={<ShieldCheck size={14} />} />
                        <ListGroup title="Cargos e Funções" items={cargos} color="bg-figueira" icon={<User size={14} />} />
                        <ListGroup title="Grupos / Células" items={grupos} color="bg-blue-600" icon={<Users2 size={14} />} />
                    </div>
                )}

                {abaAtiva === 5 && (
                    <div className="grid md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="md:col-span-2">
                            <InfoGroup label="Nome do Cônjuge" value={membro.spouse_name} />
                        </div>
                        <InfoGroup label="Data de Casamento" value={membro.wedding_date ? new Date(membro.wedding_date).toLocaleDateString('pt-PT') : '---'} />
                        <InfoGroup label="Quantidade de Filhos" value={membro.children_number?.toString() || '0'} />
                    </div>
                )}
            </div>
        </main>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function InfoGroup({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
            <p className="text-sm md:text-base font-bold text-fg tracking-tight leading-tight">{value || '---'}</p>
        </div>
    );
}

function ListGroup({ title, items, color = "bg-fg", icon }: { title: string, items: any[], color?: string, icon?: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase italic tracking-widest text-muted flex items-center gap-2">
                {icon} {title}
            </h3>
            <div className="flex flex-wrap gap-2">
                {items && items.length > 0 ? items.map((item, idx) => (
                    <span key={item.id || idx} className={`${color} text-bg text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm`}>
                        {item.nome || item.name || "Sem Nome"}
                    </span>
                )) : (
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest italic bg-soft/30 px-5 py-2.5 rounded-xl border border-dashed border-soft">
                        Nenhum registo associado
                    </span>
                )}
            </div>
        </div>
    );
}