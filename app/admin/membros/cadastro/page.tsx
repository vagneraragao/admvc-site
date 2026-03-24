"use client";

import { useState, useRef, useEffect } from "react";
import { criarNovoMembroAction, buscarCargos } from "@/actions/admin-actions";
// Precisamos importar uma função para buscar as escolaridades, ou pode criar uma action rápida para isso
import { EditableField } from "@/components/FormFields";
import SubmitButton from "@/components/SubmitButton";
import Breadcrumbs from '@/components/Breadcrumbs';
import { Camera, User, ShieldCheck, Search, Calendar, CreditCard, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";

export default function AdminCadastroMembroPage() {
    const [cargos, setCargos] = useState<any[]>([]);
    const [escolaridades, setEscolaridades] = useState<any[]>([]); // ESTADO NOVO
    const [abaAtiva, setAbaAtiva] = useState(1);
    const [loadingCP, setLoadingCP] = useState(false);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Busca dados auxiliares ao carregar a página
    useEffect(() => {
        buscarCargos().then(setCargos);

        // Exemplo: Se tiver uma action buscarEscolaridades, chame aqui. 
        // Se não tiver, pode fazer um fetch rápido para uma API route ou criar a action.
        // Para garantir que funciona, vou simular que você tem a action:
        // buscarEscolaridades().then(setEscolaridades); 
    }, []);

    // 1. ESTADO CENTRALIZADO (Dono da verdade)
    const [formValues, setFormValues] = useState<any>({
        first_name: "", last_name: "", email: "", password: "", phone_1: "",
        birthdate: "", gender: "Masculino", marital_status: "Solteiro(a)",
        profession: "", father_name: "", mother_name: "",
        escolaridade_id: "", conversion_date: "", // CAMPOS NOVOS
        address_1: "", address_number: "", postal_code: "", neighborhood: "", city: "", country: "Portugal",
        loyverse_id: "", baptism_date: "", admission_date: new Date().toISOString().split('T')[0],
        status: "ATIVO", church_role: "", notes: "", // Mudei status para 'ATIVO' (maiúsculas) para bater certo com a BD
        spouse_name: "", children_count: "0",
        role: "USER" // Mudei para 'USER' (padrão da BD)
    });

    // Função de atualização genérica
    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        const cleanName = name.replace("_display", "");
        setFormValues((prev: any) => ({ ...prev, [cleanName]: value }));
    };

    // MAGIA DO CÓDIGO POSTAL (geoapi.pt) - Igual à Edição!
    const handleCodigoPostalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value.replace(/\D/g, '');

        if (valor.length > 4) {
            valor = valor.substring(0, 4) + '-' + valor.substring(4, 7);
        }

        setFormValues((prev: any) => ({ ...prev, postal_code: valor }));

        if (valor.length === 8) {
            setLoadingCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${valor}`);
                if (res.ok) {
                    const data = await res.json();
                    const info = Array.isArray(data) ? data[0] : data;

                    if (info && !info.erro) {
                        setFormValues((prev: any) => ({
                            ...prev,
                            address_1: info.rua || (info.ruas && info.ruas[0]) || prev.address_1,
                            neighborhood: info.Freguesia || prev.neighborhood,
                            city: info.Localidade || info.Município || prev.city,
                        }));
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar Código Postal:", error);
            } finally {
                setLoadingCP(false);
            }
        }
    }

    const abas = [
        { id: 1, label: "Pessoal", icon: <User size={14} /> },
        { id: 2, label: "Endereço", icon: "📍" },
        { id: 3, label: "Eclesiástico", icon: <Calendar size={14} /> },
        { id: 4, label: "Família", icon: "👨‍👩‍👧‍👦" },
    ];

    return (
        <main className="max-w-5xl mx-auto space-y-10 py-10 px-6 animate-in fade-in">
            <Breadcrumbs items={[{ label: "Membros", href: "/admin/membros" }, { label: "Novo Registro" }]} />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-soft pb-8 gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">Novo Membro</h1>
                    <p className="text-[10px] font-black text-figueira uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={12} /> {formValues.role} • {formValues.status}
                    </p>
                </div>
                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                        <p>Progresso</p>
                        <p>{Math.round((abaAtiva / 4) * 100)}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-soft rounded-full overflow-hidden">
                        <div className="h-full bg-figueira transition-all duration-500" style={{ width: `${(abaAtiva / 4) * 100}%` }} />
                    </div>
                </div>
            </header>

            <nav className="flex flex-wrap gap-2 bg-bg2 p-2 rounded-[2.5rem] border border-soft shadow-sm">
                {abas.map(a => (
                    <button key={a.id} type="button" onClick={() => setAbaAtiva(a.id)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === a.id ? "bg-fg text-bg shadow-xl scale-[1.02]" : "text-muted hover:bg-soft"}`}>
                        {a.icon} <span className="hidden md:inline">{a.label}</span>
                    </button>
                ))}
            </nav>

            <form
                action={async (formData) => {
                    Object.keys(formValues).forEach(key => {
                        formData.set(key, formValues[key]);
                    });

                    // Adicionamos o is_active true por padrão ao criar um membro
                    formData.set('is_active', 'true');

                    const result = await criarNovoMembroAction(formData);
                    if (result?.error) alert(result.error);
                }}
                className="space-y-8 pb-20"
            >
                {/* ABA 1: PESSOAL */}
                <div className={abaAtiva === 1 ? "block space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
                    <div className="bg-bg2 border border-soft p-8 rounded-[3rem] flex items-center gap-8 shadow-sm">
                        <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white bg-soft shrink-0 shadow-lg">
                            {previewFoto ? <Image src={previewFoto} alt="Preview" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted/20"><User size={40} /></div>}
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-fg text-bg p-2 rounded-xl shadow-lg hover:bg-figueira transition-all"><Camera size={16} /></button>
                            <input type="file" name="avatar" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setPreviewFoto(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black uppercase italic text-fg">Fotografia</h3>
                            <p className="text-[10px] font-bold text-muted uppercase">Obrigatório para o Cartão Digital</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <EditableField label="Primeiro Nome" name="first_name_display" value={formValues.first_name} onChange={handleInputChange} required />
                        <EditableField label="Sobrenome" name="last_name_display" value={formValues.last_name} onChange={handleInputChange} required />
                        <EditableField label="E-mail" name="email_display" type="email" value={formValues.email} onChange={handleInputChange} required />
                        <EditableField label="Senha" name="password_display" type="password" value={formValues.password} onChange={handleInputChange} required />
                        <EditableField label="Telemóvel" name="phone_1_display" value={formValues.phone_1} onChange={handleInputChange} required />
                        <EditableField label="Nascimento" name="birthdate_display" type="date" value={formValues.birthdate} onChange={handleInputChange} />
                        <EditableField label="Profissão" name="profession_display" value={formValues.profession} onChange={handleInputChange} />
                        <EditableField label="Nome do Pai" name="father_name_display" value={formValues.father_name} onChange={handleInputChange} />
                        <EditableField label="Nome da Mãe" name="mother_name_display" value={formValues.mother_name} onChange={handleInputChange} />
                        <EditableField label="Gênero" name="gender_display" isSelect options={['Masculino', 'Feminino']} value={formValues.gender} onChange={handleInputChange} />
                        <EditableField label="Estado Civil" name="marital_status_display" isSelect options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']} value={formValues.marital_status} onChange={handleInputChange} />

                        {/* CAMPOS NOVOS */}
                        {/* Como você usa o EditableField que parece só aceitar array de strings no options, 
                            uma forma simples é passar os nomes das escolaridades se o backend souber tratar pelo nome, 
                            ou criar um Select normal. Vou usar Select normal para garantir que passa o ID. */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-4">Escolaridade</label>
                            <select
                                name="escolaridade_id_display"
                                value={formValues.escolaridade_id}
                                onChange={handleInputChange}
                                className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Selecione...</option>
                                {/* Exemplo estático caso a Action falhe: */}
                                <option value="1">Ensino Básico</option>
                                <option value="2">Ensino Secundário</option>
                                <option value="3">Ensino Profissional</option>
                                <option value="4">Licenciatura</option>
                                <option value="5">Mestrado</option>
                                <option value="6">Doutoramento</option>
                            </select>
                        </div>
                        <EditableField label="Data de Conversão" name="conversion_date_display" type="date" value={formValues.conversion_date} onChange={handleInputChange} />
                    </div>
                </div>

                {/* ABA 2: ENDEREÇO */}
                <div className={abaAtiva === 2 ? "block space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
                    <div className="grid md:grid-cols-4 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <div className="md:col-span-1 relative">
                            {/* Mudámos para usar a função nova diretamente */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-4">Cód. Postal (PT)</label>
                                <input
                                    type="text"
                                    name="postal_code_display"
                                    value={formValues.postal_code}
                                    onChange={handleCodigoPostalChange}
                                    placeholder="0000-000"
                                    maxLength={8}
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm"
                                />
                            </div>
                            {loadingCP && <Loader2 size={16} className="absolute right-4 top-11 animate-spin text-figueira" />}
                        </div>
                        <div className="md:col-span-3">
                            <EditableField label="Morada / Rua" name="address_1_display" value={formValues.address_1} onChange={handleInputChange} />
                        </div>
                        <EditableField label="Nº / Porta" name="address_number_display" value={formValues.address_number} onChange={handleInputChange} />
                        <EditableField label="Freguesia / Bairro" name="neighborhood_display" value={formValues.neighborhood} onChange={handleInputChange} />
                        <EditableField label="Cidade / Local" name="city_display" value={formValues.city} onChange={handleInputChange} />
                        <EditableField label="País" name="country_display" value={formValues.country} onChange={handleInputChange} />
                    </div>
                </div>

                {/* ABA 3: ECLESIÁSTICO */}
                <div className={abaAtiva === 3 ? "block space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
                    <div className="grid md:grid-cols-2 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <div className="md:col-span-2 p-6 bg-figueira/5 border border-figueira/10 rounded-[2rem] space-y-4">
                            <p className="text-[10px] font-black uppercase text-fg flex items-center gap-2"><ShieldCheck size={16} className="text-figueira" /> Nível de Acesso</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['USER', 'LEADER', 'FINANCE', 'ADMIN'].map(r => ( // Mudei para as roles reais do Prisma
                                    <button key={r} type="button" onClick={() => setFormValues({ ...formValues, role: r })} className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formValues.role === r ? 'bg-fg text-bg border-fg' : 'bg-bg text-muted border-soft'}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 p-4 bg-soft/20 rounded-2xl flex items-center gap-4">
                            <CreditCard size={20} className="text-muted" />
                            <EditableField label="ID Loyverse (Cantina)" name="loyverse_id_display" value={formValues.loyverse_id} onChange={handleInputChange} placeholder="Ex: 123456" />
                        </div>
                        <EditableField label="Data de Admissão" name="admission_date_display" type="date" value={formValues.admission_date} onChange={handleInputChange} />
                        <EditableField label="Data de Batismo" name="baptism_date_display" type="date" value={formValues.baptism_date} onChange={handleInputChange} />
                        <EditableField label="Cargo Eclesiástico" name="church_role_display" isSelect options={cargos.map(c => c.nome)} value={formValues.church_role} onChange={handleInputChange} />
                        <EditableField label="Status Atual" name="status_display" isSelect options={['ATIVO', 'INATIVO', 'VISITANTE', 'PENDENTE']} value={formValues.status} onChange={handleInputChange} />
                        <div className="md:col-span-2"><EditableField label="Notas Pastorais" name="notes_display" isTextarea value={formValues.notes} onChange={handleInputChange} /></div>
                    </div>
                </div>

                {/* ABA 4: FAMÍLIA */}
                <div className={abaAtiva === 4 ? "block grid md:grid-cols-2 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] animate-in slide-in-from-right-4 shadow-xl" : "hidden"}>
                    <EditableField label="Nome do Cônjuge" name="spouse_name_display" value={formValues.spouse_name} onChange={handleInputChange} />
                    <EditableField label="Número de Filhos" name="children_count_display" type="number" value={formValues.children_count} onChange={handleInputChange} />
                </div>

                {/* NAVEGAÇÃO */}
                <div className="flex justify-between items-center bg-bg2 p-4 rounded-[2.5rem] border border-soft shadow-inner">
                    <button type="button" disabled={abaAtiva === 1} onClick={() => setAbaAtiva(a => a - 1)} className="px-8 flex items-center gap-2 text-[10px] font-black uppercase text-muted hover:text-fg disabled:opacity-0 transition-all"><ChevronLeft size={14} /> Anterior</button>
                    {abaAtiva < 4 ?
                        <button type="button" onClick={() => setAbaAtiva(a => a + 1)} className="bg-fg text-bg px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-figueira transition-all flex items-center gap-2">Próximo Passo <ChevronRight size={14} /></button>
                        : <SubmitButton label="Finalizar Cadastro" />
                    }
                </div>
            </form>
        </main>
    );
}