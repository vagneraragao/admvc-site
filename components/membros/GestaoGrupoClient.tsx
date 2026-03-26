'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, ChevronRight, Users, Save, Loader2,
    Check, MapPin, Clock, CalendarDays, Edit3, User,
    ShieldCheck, Phone, Camera, CheckSquare, FileText, History, Image as ImageIcon
} from 'lucide-react'
import { registrarEncontroAction } from '@/actions/grupo-actions'

// 👇 Agora recebe a propriedade ehLider
export default function GestaoGrupoClient({ grupo, ehLider }: { grupo: any, ehLider: boolean }) {

    // Se for líder abre na aba 1 (Definições), se for membro abre na aba 4 (Histórico)
    const [abaAtiva, setAbaAtiva] = useState(ehLider ? 1 : 4);
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    // ========================================================================
    // JUNTAR LÍDERES E MEMBROS PARA A CHAMADA / LISTA DE EQUIPA
    // ========================================================================
    const participantesMap = new Map();
    if (grupo.lideres) grupo.lideres.forEach((l: any) => participantesMap.set(l.id, { ...l, isLider: true }));
    if (grupo.membros) grupo.membros.forEach((m: any) => {
        if (!participantesMap.has(m.id)) participantesMap.set(m.id, { ...m, isLider: false });
    });
    const todosParticipantes = Array.from(participantesMap.values());

    const [presentes, setPresentes] = useState<number[]>([]);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const togglePresenca = (membroId: number) => {
        setPresentes(prev => prev.includes(membroId) ? prev.filter(id => id !== membroId) : [...prev, membroId]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewFoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    async function handleSalvarDefinicoes(formData: FormData) {
        setLoading(true);
        // await atualizarDadosGrupo(grupo.id, formData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setSucesso(true);
        setTimeout(() => setSucesso(false), 3000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleRegistrarEncontro(formData: FormData) {
        if (!formData.get('data') || !formData.get('tema')) {
            alert("A data e o resumo do encontro são obrigatórios.");
            return;
        }

        setLoading(true);
        formData.append('grupo_id', grupo.id.toString());

        const res = await registrarEncontroAction(formData, presentes);

        setLoading(false);
        if (res.sucesso) {
            setSucesso(true);
            setPresentes([]);
            setPreviewFoto(null);
            setTimeout(() => setSucesso(false), 4000);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(res.erro);
        }
    }

    return (
        <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-24">

            <nav className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    <Link href="/membros/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                        <ArrowLeft size={12} strokeWidth={3} /> Minha Dashboard
                    </Link>
                    <ChevronRight size={10} className="opacity-30" />
                    <span className="text-fg italic hidden sm:inline">{ehLider ? "Gestão de Célula" : "A Minha Célula"}</span>
                </div>
            </nav>

            <header className="bg-blue-600 text-white p-8 md:p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-20 -mt-20 rounded-full pointer-events-none"></div>
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-[2rem] border-4 border-white/20 flex items-center justify-center shrink-0 shadow-lg relative z-10 backdrop-blur-sm">
                    <Users size={48} className="text-white drop-shadow-md" />
                </div>
                <div className="text-center md:text-left space-y-4 flex-1 pt-2 relative z-10">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                        <span className="px-3 py-1 bg-white/20 text-white border border-white/20 text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm">
                            {grupo.categoria || 'Célula / Grupo'}
                        </span>
                        <span className="px-3 py-1 bg-white/10 text-white/80 border border-white/10 text-[8px] font-black uppercase tracking-widest rounded-md">
                            {todosParticipantes.length} Participantes
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{grupo.nome}</h1>
                    <div className="text-[10px] font-bold text-blue-100 uppercase tracking-widest pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <ShieldCheck size={14} className="shrink-0" /> Líderes:
                        {grupo.lideres && grupo.lideres.length > 0 ? grupo.lideres.map((lider: any) => (
                            <span key={lider.id} className="bg-blue-800/50 px-3 py-1 rounded-md border border-blue-400/30">{lider.first_name} {lider.last_name}</span>
                        )) : <span className="opacity-50 italic">Nenhum líder associado</span>}
                    </div>
                </div>
            </header>

            {sucesso && (
                <div className="flex items-center gap-3 text-green-600 bg-green-50 px-6 py-4 rounded-2xl border border-green-200 animate-in slide-in-from-top-4 shadow-sm">
                    <Check size={18} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ação registada com sucesso!</span>
                </div>
            )}

            {/* 👇 MENUS CONDICIONAIS */}
            <nav className="flex flex-wrap gap-2 border-b border-soft pb-4 sticky top-0 bg-bg/90 backdrop-blur-md z-30 pt-4">

                {ehLider && (
                    <button onClick={() => setAbaAtiva(1)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === 1 ? "bg-blue-600 text-white shadow-md" : "bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg"}`}>
                        <Edit3 size={14} /> Definições
                    </button>
                )}

                {/* Membros normais podem ver quem está na equipa com eles */}
                <button onClick={() => setAbaAtiva(2)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === 2 ? "bg-blue-600 text-white shadow-md" : "bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg"}`}>
                    <Users size={14} /> A Nossa Equipa
                </button>

                {ehLider && (
                    <button onClick={() => setAbaAtiva(3)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === 3 ? "bg-blue-600 text-white shadow-md" : "bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg"}`}>
                        <CalendarDays size={14} /> Novo Encontro
                    </button>
                )}

                {/* Todos podem ver o histórico */}
                <button onClick={() => setAbaAtiva(4)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === 4 ? "bg-fg text-bg shadow-md" : "bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg"}`}>
                    <History size={14} /> Relatórios / Histórico
                </button>

            </nav>

            <div className="bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-sm min-h-[400px]">

                {/* ABA 1: CONFIGURAÇÕES (SÓ LÍDER) */}
                {abaAtiva === 1 && ehLider && (
                    <form action={handleSalvarDefinicoes} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between border-b border-soft pb-6">
                            <div>
                                <h4 className="text-xl font-black uppercase italic text-fg">Dados Gerais</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Defina o foco, localização e horários.</p>
                            </div>
                            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Alterações
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <InputBox label="Nome do Grupo" name="nome" defaultValue={grupo.nome} icon={<Users size={14} />} />

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2">
                                    <Edit3 size={12} className="text-blue-500" /> Descrição
                                </label>
                                <textarea name="descricao" rows={3} defaultValue={grupo.descricao || ''} className="w-full bg-bg border border-soft rounded-[2rem] p-5 text-xs font-bold text-fg focus:border-blue-500 outline-none transition-all shadow-sm resize-none" />
                            </div>

                            <InputBox label="Dia da Semana" name="dia_semana" defaultValue={grupo.dia_semana || ''} icon={<CalendarDays size={14} />} />
                            <InputBox label="Horário" name="horario" defaultValue={grupo.horario || ''} icon={<Clock size={14} />} type="time" />

                            <div className="md:col-span-2 pt-6 border-t border-soft">
                                <h5 className="text-[10px] font-black uppercase text-muted tracking-[0.2em] mb-4 flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> Localização / Morada</h5>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2"><InputBox label="Endereço (Rua)" name="endereco" defaultValue={grupo.endereco || ''} /></div>
                                    <InputBox label="Número/Porta" name="numero" defaultValue={grupo.numero || ''} />
                                    <InputBox label="Bairro/Freguesia" name="bairro" defaultValue={grupo.bairro || ''} />
                                    <InputBox label="Cidade" name="cidade" defaultValue={grupo.cidade || ''} />
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ABA 2: EQUIPA (TODOS VÊEM) */}
                {abaAtiva === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-soft pb-6 flex justify-between items-end">
                            <div>
                                <h4 className="text-xl font-black uppercase italic text-fg">Participantes</h4>
                            </div>
                            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                                Total: {todosParticipantes.length}
                            </div>
                        </div>

                        {todosParticipantes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todosParticipantes.map((membro: any) => (
                                    <div key={membro.id} className={`bg-bg border ${membro.isLider ? 'border-blue-200' : 'border-soft'} p-4 rounded-3xl flex items-center gap-4 shadow-sm group relative overflow-hidden`}>
                                        {membro.isLider && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                                        <div className="w-12 h-12 rounded-2xl bg-soft overflow-hidden relative shrink-0 flex items-center justify-center text-muted ml-2">
                                            {membro.avatar_file ? <img src={membro.avatar_file} className="w-full h-full object-cover" /> : <User size={20} />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h5 className="text-sm font-black uppercase text-fg truncate">{membro.first_name} {membro.last_name}</h5>
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1 flex items-center gap-1">
                                                {membro.isLider ? <ShieldCheck size={10} className="text-blue-500" /> : <Phone size={10} className="text-blue-500" />}
                                                {membro.isLider ? 'Líder' : (membro.phone_1 || 'Sem contacto')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-12 text-center text-xs font-black uppercase text-muted bg-bg border-2 border-dashed border-soft rounded-[3rem]">Sem membros.</p>
                        )}
                    </div>
                )}

                {/* ABA 3: REGISTAR ENCONTRO (SÓ LÍDER) */}
                {abaAtiva === 3 && ehLider && (
                    <form action={handleRegistrarEncontro} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-soft pb-6">
                            <div>
                                <h4 className="text-xl font-black uppercase italic text-fg">Relatório do Encontro</h4>
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:w-auto bg-fg text-bg px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar Relatório
                            </button>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2"><CalendarDays size={12} className="text-blue-500" /> Data do Encontro</label>
                                    <input type="date" name="data" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-bg border border-soft rounded-[2rem] p-5 text-sm font-bold text-fg focus:border-blue-500 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2"><FileText size={12} className="text-blue-500" /> Tema / Resumo</label>
                                    <textarea name="tema" required rows={4} className="w-full bg-bg border border-soft rounded-[2rem] p-5 text-xs font-bold text-fg focus:border-blue-500 outline-none resize-none leading-relaxed" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2"><Camera size={12} className="text-blue-500" /> Fotografia (Opcional)</label>
                                    <div onClick={() => fileInputRef.current?.click()} className={`w-full h-40 rounded-[2rem] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${previewFoto ? 'border-blue-500' : 'border-soft bg-bg'}`}>
                                        {previewFoto ? (
                                            <><img src={previewFoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-black uppercase bg-blue-600 px-4 py-2 rounded-xl">Trocar Foto</span></div></>
                                        ) : (
                                            <div className="text-center text-muted"><Camera size={32} className="mx-auto mb-2 opacity-50" /><span className="text-[10px] font-black uppercase tracking-widest">Clique para enviar</span></div>
                                        )}
                                        <input type="file" name="foto" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg border border-soft rounded-[2.5rem] p-6 md:p-8 shadow-sm h-max">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-soft">
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-fg flex items-center gap-2"><CheckSquare size={16} className="text-blue-500" /> Presenças</h4>
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-100">{presentes.length} / {todosParticipantes.length}</span>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {todosParticipantes.length > 0 ? todosParticipantes.map((membro: any) => {
                                        const isPresente = presentes.includes(membro.id);
                                        return (
                                            <button key={membro.id} type="button" onClick={() => togglePresenca(membro.id)} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${isPresente ? 'bg-green-500/10 border-green-500/30 shadow-sm' : 'bg-bg2 border-soft hover:border-blue-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isPresente ? 'bg-green-500 text-white shadow-md' : 'bg-soft text-muted'}`}>
                                                        {isPresente ? <Check size={16} strokeWidth={3} /> : (membro.isLider ? <ShieldCheck size={16} /> : <User size={16} />)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-xs font-black uppercase leading-none transition-colors ${isPresente ? 'text-green-700' : 'text-fg'}`}>{membro.first_name} {membro.last_name} {membro.isLider && <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded ml-1">LÍDER</span>}</p>
                                                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted mt-0.5">{isPresente ? 'Presente' : 'Ausente'}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    }) : <p className="text-[10px] text-center text-muted">Sem membros.</p>}
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ABA 4: HISTÓRICO (TODOS VÊEM) */}
                {abaAtiva === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-soft pb-6">
                            <h4 className="text-xl font-black uppercase italic text-fg">Histórico de Encontros</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Registo das últimas reuniões desta célula.</p>
                        </div>

                        {grupo.encontros && grupo.encontros.length > 0 ? (
                            <div className="space-y-6">
                                {grupo.encontros.map((encontro: any) => (
                                    <div key={encontro.id} className="bg-bg border border-soft p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="w-full md:w-48 h-32 md:h-auto rounded-2xl bg-bg2 border border-soft overflow-hidden shrink-0 flex items-center justify-center relative">
                                            {encontro.foto_url ? <img src={encontro.foto_url} className="w-full h-full object-cover" /> : <div className="text-muted/30 text-center"><ImageIcon size={40} className="mx-auto mb-2" /><span className="text-[8px] font-black uppercase tracking-widest">Sem Foto</span></div>}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                                                    <CalendarDays size={12} /> {new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(encontro.data))}
                                                </div>
                                                <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                                                    <Users size={12} /> {encontro.presentes?.length || 0} Presentes
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[9px] font-black uppercase text-muted tracking-widest mb-1 block">O que foi ministrado:</span>
                                                <p className="text-sm font-bold text-fg leading-relaxed bg-bg2 p-4 rounded-2xl border border-soft/50">{encontro.tema}</p>
                                            </div>

                                            {encontro.presentes && encontro.presentes.length > 0 && (
                                                <div className="pt-2">
                                                    <span className="text-[8px] font-black uppercase text-muted tracking-widest block mb-2">Pessoas que participaram:</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {encontro.presentes.map((p: any) => (
                                                            <span key={p.id} className="text-[9px] font-bold bg-soft px-2 py-1 rounded-md text-fg">{p.first_name} {p.last_name}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center bg-bg border-2 border-dashed border-soft rounded-[3rem]">
                                <History size={48} className="text-muted/30 mx-auto mb-4" />
                                <p className="text-sm font-black uppercase text-muted tracking-widest">Nenhum encontro registado.</p>
                                {ehLider && <button onClick={() => setAbaAtiva(3)} className="mt-4 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:underline">Registar o primeiro encontro</button>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}

function InputBox({ label, name, defaultValue, type = "text", placeholder, icon }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2">
                {icon && <span className="text-blue-500">{icon}</span>} {label}
            </label>
            <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-blue-500 outline-none transition-all shadow-sm" />
        </div>
    )
}