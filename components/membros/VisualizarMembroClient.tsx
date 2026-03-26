"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, ChevronRight, User, MapPin, Church,
    ShieldCheck, Users2, Edit3, CreditCard, Calendar,
    Lock, CheckCircle2, XCircle, Home, Mail, Phone
} from "lucide-react";
import Image from "next/image";

export default function VisualizarMembroClient({ membro }: any) {
    const [abaAtiva, setAbaAtiva] = useState(1);

    const departamentos = membro.ministerios?.map((m: any) => ({ ...m.departamento, funcao: m.funcao })) || [];
    const grupos = membro.grupos || [];
    const gruposLiderados = membro.lider_de_grupo || [];
    const todosGrupos = [...gruposLiderados.map((g: any) => ({ ...g, isLider: true })), ...grupos];

    const abas = [
        { id: 1, label: "Perfil", icon: <User size={14} /> },
        { id: 2, label: "Morada", icon: <MapPin size={14} /> },
        { id: 3, label: "Família", icon: <Users2 size={14} /> },
        { id: 4, label: "Eclesiástico", icon: <Church size={14} /> },
        { id: 5, label: "Serviço", icon: <ShieldCheck size={14} /> },
    ];

    const formatDate = (date: any) => date ? new Date(date).toLocaleDateString('pt-PT') : '---';

    // Componente de Status Documental (Leitura)
    const StatusDoc = ({ nome, aceite, validade }: any) => {
        const expirado = validade && new Date(validade) < new Date();
        const ok = aceite && !expirado;

        return (
            <div className={`flex items-center gap-3 p-3 pr-5 rounded-2xl border ${ok ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${ok ? 'text-green-700' : 'text-red-600'}`}>
                        {nome}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${ok ? 'text-green-600/70' : 'text-red-500/70'}`}>
                        {ok && validade ? `Válido até ${formatDate(validade)}` : ok ? 'Assinado' : 'Pendente / Expirado'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-24">

            {/* BREADCRUMBS */}
            <nav className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    <Link href="/admin/membros" className="hover:text-figueira transition-colors flex items-center gap-2">
                        <ArrowLeft size={12} strokeWidth={3} /> Voltar à Lista
                    </Link>
                    <ChevronRight size={10} className="opacity-30" />
                    <span className="text-fg italic hidden sm:inline">Ficha do Membro</span>
                </div>

                {/* BOTÃO DE AÇÃO NO TOPO (Padrão Admin) */}
                <Link
                    href={`/admin/membros/editar/${membro.id}`}
                    className="flex items-center gap-2 bg-fg text-bg px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-figueira transition-all shadow-lg active:scale-95"
                >
                    <Edit3 size={14} /> Editar
                </Link>
            </nav>

            {/* CABEÇALHO DO PERFIL (CARD PREMIUM) */}
            <header className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm relative overflow-visible flex flex-col md:flex-row items-center md:items-start gap-8">

                {/* FOTO E BADGES */}
                <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-soft relative z-10">
                        {membro.avatar_file ? (
                            <Image src={membro.avatar_file} alt="Foto de Perfil" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted bg-bg">
                                <User size={48} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                    {/* Badge Sobreposta */}
                    <div className={`absolute -bottom-4 z-20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-white shadow-lg ${membro.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {membro.is_active ? 'Ativo' : 'Bloqueado'}
                    </div>
                </div>

                {/* DADOS PRINCIPAIS */}
                <div className="text-center md:text-left space-y-4 flex-1 pt-2">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                        <span className="px-3 py-1 bg-figueira/10 text-figueira border border-figueira/20 text-[8px] font-black uppercase tracking-widest rounded-md">
                            ID #{membro.id}
                        </span>
                        <span className="px-3 py-1 bg-soft text-muted border border-soft text-[8px] font-black uppercase tracking-widest rounded-md">
                            {membro.role || 'USER'}
                        </span>
                        <span className="px-3 py-1 bg-soft text-muted border border-soft text-[8px] font-black uppercase tracking-widest rounded-md">
                            {membro.status || 'PENDENTE'}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        {membro.first_name} <span className="text-muted">{membro.last_name}</span>
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-[11px] font-bold text-muted uppercase tracking-widest pt-2">
                        <span className="flex items-center gap-2"><Mail size={14} className="text-figueira" /> {membro.email}</span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-soft"></span>
                        <span className="flex items-center gap-2"><Phone size={14} className="text-figueira" /> {membro.phone_1 || '---'}</span>
                    </div>
                </div>
            </header>

            {/* BANNER FAMÍLIA E COMPLIANCE */}
            <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${membro.familia ? 'bg-figueira text-white shadow-md' : 'bg-soft text-muted'}`}>
                        <Home size={24} />
                    </div>
                    <div>
                        {membro.familia ? (
                            <>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Família {membro.familia.surname}</h3>
                                <p className="text-[9px] text-figueira font-black uppercase tracking-widest mt-1 bg-figueira/10 px-2 py-0.5 rounded border border-figueira/20 inline-block">Grupo Familiar Vinculado</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">FAMÍLIA ADMVC</h3>
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">Nenhum vínculo registado</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="hidden lg:block w-[1px] h-12 bg-soft mx-2"></div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <StatusDoc nome="Acordo GDPR" aceite={membro.gdpr_aceite} validade={membro.gdpr_validade} />
                    <StatusDoc nome="Termo Permanecer" aceite={membro.permanecer_aceite} validade={membro.permanecer_validade} />
                </div>
            </div>

            {/* NAVEGAÇÃO POR ABAS */}
            <nav className="flex flex-wrap gap-2 border-b border-soft pb-4 sticky top-0 bg-bg/90 backdrop-blur-md z-30 pt-4">
                {abas.map((aba) => (
                    <button
                        key={aba.id}
                        onClick={() => setAbaAtiva(aba.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === aba.id ? "bg-fg text-bg shadow-lg" : "bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg"}`}
                    >
                        {aba.icon} <span className="hidden sm:inline">{aba.label}</span>
                    </button>
                ))}
            </nav>

            {/* CONTEÚDO DAS ABAS */}
            <div className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm min-h-[450px]">

                {abaAtiva === 1 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InfoGroup label="Gênero" value={membro.gender} />
                        <InfoGroup label="Nascimento" value={formatDate(membro.birthdate)} />
                        <InfoGroup label="Nacionalidade" value={membro.nationality} />

                        <InfoGroup label="Profissão" value={membro.profession} />
                        <InfoGroup label="Escolaridade" value={membro.escolaridade?.nome || 'Não informada'} />
                        <InfoGroup label="Idioma Preferencial" value={membro.lang === 'pt' ? 'Português' : membro.lang} />

                        <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-soft grid md:grid-cols-2 gap-10">
                            <InfoGroup label="Nome do Pai" value={membro.father_name} />
                            <InfoGroup label="Nome da Mãe" value={membro.mother_name} />
                        </div>
                    </div>
                )}

                {abaAtiva === 2 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="md:col-span-2 lg:col-span-3">
                            <InfoGroup label="Morada Principal (Endereço)" value={`${membro.address_1 || '---'} ${membro.address_2 ? `, ${membro.address_2}` : ''}`} />
                        </div>
                        <InfoGroup label="Número / Porta" value={membro.address_number} />
                        <InfoGroup label="Freguesia / Bairro" value={membro.neighborhood} />
                        <InfoGroup label="Código Postal" value={membro.postal_code} />
                        <InfoGroup label="Cidade / Município" value={membro.city || membro.id_city} />
                        <InfoGroup label="Distrito / Estado" value={membro.state} />
                        <InfoGroup label="País" value={membro.country} />
                    </div>
                )}

                {abaAtiva === 3 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InfoGroup label="Estado Civil" value={membro.marital_status} />
                        <InfoGroup label="Nome do Cônjuge" value={membro.spouse_name} />
                        <InfoGroup label="Data de Casamento" value={formatDate(membro.wedding_date)} />

                        <InfoGroup label="Cônjuge é Cristão?" value={membro.spouse_christian ? 'Sim' : membro.spouse_christian === false ? 'Não' : '---'} />
                        <InfoGroup label="Tem Filhos?" value={membro.has_children ? 'Sim' : membro.has_children === false ? 'Não' : '---'} />
                        <InfoGroup label="Nº de Filhos" value={membro.children_number?.toString() || '0'} />

                        <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-soft grid md:grid-cols-2 gap-10">
                            <InfoGroup label="NIF / Identificação Fiscal" value={membro.tax_id} />
                            <InfoGroup label="Cartão de Cidadão / RG" value={membro.id_card_number} />
                        </div>
                    </div>
                )}

                {abaAtiva === 4 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <InfoGroup label="Status de Batismo" value={membro.baptism_status} />
                        <InfoGroup label="Data de Batismo" value={formatDate(membro.baptism_date)} />
                        <InfoGroup label="Data de Conversão" value={formatDate(membro.conversion_date)} />

                        <InfoGroup label="Data de Entrada (Membro)" value={formatDate(membro.entry_date)} />
                        <InfoGroup label="Cargo Eclesiástico" value={membro.church_role} />
                        <InfoGroup label="Igreja Anterior" value={membro.previous_church} />

                        <div className="md:col-span-2 lg:col-span-3 bg-bg border border-soft p-8 rounded-3xl shadow-inner mt-4">
                            <InfoGroup label="Testemunho / Notas Pastorais" value={membro.notes || "Sem anotações registadas para este membro."} />
                        </div>
                    </div>
                )}

                {abaAtiva === 5 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* LOYVERSE INFO NO TOPO DA ABA DE SERVIÇO */}
                        <div className="p-6 bg-figueira/5 border border-figueira/20 rounded-3xl flex items-center justify-between gap-4 max-w-xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-figueira text-white p-3 rounded-xl shadow-md"><CreditCard size={20} /></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-figueira tracking-widest">Integração Cantina (Loyverse)</p>
                                    <p className="text-sm font-bold text-fg uppercase">{membro.loyverse_id || 'Não Vinculado'}</p>
                                </div>
                            </div>
                            {membro.loyverse_id && <CheckCircle2 size={24} className="text-figueira opacity-50" />}
                        </div>

                        <ListGroup title="Departamentos & Funções" items={departamentos} color="bg-fg text-bg" icon={<ShieldCheck size={14} />} showFuncao={true} />
                        <ListGroup title="Grupos & Células" items={todosGrupos} color="bg-blue-600 text-white" icon={<Users2 size={14} />} />
                    </div>
                )}
            </div>
        </main>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES (Design System)
// ============================================================================

function InfoGroup({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1.5 relative group">
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
            <div className="bg-bg border border-soft px-4 py-3 rounded-xl transition-all group-hover:border-figueira/30 shadow-sm">
                <p className={`text-[11px] font-bold tracking-tight ${!value || value === '---' ? 'text-muted/50 italic' : 'text-fg'}`}>
                    {value || '---'}
                </p>
            </div>
        </div>
    );
}

function ListGroup({ title, items, color = "bg-fg text-bg", icon, showFuncao = false }: { title: string, items: any[], color?: string, icon?: React.ReactNode, showFuncao?: boolean }) {
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase italic tracking-widest text-muted flex items-center gap-2 border-b border-soft pb-2">
                {icon} {title}
            </h3>
            <div className="flex flex-wrap gap-3 pt-2">
                {items && items.length > 0 ? items.map((item, idx) => (
                    <div key={item.id || idx} className={`${color} px-4 py-2 rounded-xl shadow-sm flex flex-col justify-center border border-black/5`}>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                            {item.nome || item.name || "Sem Nome"}
                        </span>
                        {showFuncao && item.funcao && (
                            <span className="text-[8px] font-bold uppercase tracking-wider opacity-70 mt-0.5">
                                {item.funcao}
                            </span>
                        )}
                        {item.isLider && (
                            <span className="text-[8px] font-bold uppercase tracking-wider opacity-90 mt-0.5 bg-white/20 inline-block px-1.5 rounded w-max">
                                Líder
                            </span>
                        )}
                    </div>
                )) : (
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest italic bg-bg px-5 py-3 rounded-xl border border-dashed border-soft">
                        Nenhum registo associado
                    </span>
                )}
            </div>
        </div>
    );
}