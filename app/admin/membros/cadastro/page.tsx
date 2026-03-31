"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarNovoMembroAction, buscarCargos } from "@/actions/admin-actions";
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Camera, User, ShieldCheck, Calendar, CreditCard, ChevronRight, ChevronLeft, Loader2, CheckCircle2, MapPin, Scale, Lock, Home } from "lucide-react";
import Image from "next/image";

export default function AdminCadastroMembroPage() {
    const router = useRouter();
    const [cargos, setCargos] = useState<any[]>([]);
    const [abaAtiva, setAbaAtiva] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estado para controle de exibição condicional (Pescado do seu Editor)
    const [temFilhos, setTemFilhos] = useState("false");

    useEffect(() => {
        buscarCargos().then(setCargos);
    }, []);

    // ========================================================================
    // ESTADO CENTRALIZADO (COM TODOS OS CAMPOS)
    // ========================================================================
    const [formValues, setFormValues] = useState<any>({
        // Pessoal
        first_name: "", last_name: "", email: "", password: "", phone_1: "",
        birthdate: "", gender: "Masculino", marital_status: "Solteiro(a)",
        profession: "", nationality: "Portuguesa", tax_id: "",
        father_name: "", mother_name: "", escolaridade_id: "",

        // Morada
        postal_code: "", address_1: "", address_number: "", address_2: "",
        neighborhood: "", city: "", state: "", country: "Portugal",

        // Eclesiástico
        conversion_date: "", baptism_date: "", admission_date: new Date().toISOString().split('T')[0],
        church_role: "Membro", status: "ATIVO", role: "USER",
        loyverse_id: "", notes: "",

        // Família & Legal
        spouse_name: "", children_count: "0",
        gdpr_aceite: false, permanecer_aceite: false
    });

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormValues((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ========================================================================
    // MAGIA DO CÓDIGO POSTAL (LOGICA DO SEU EDITOR)
    // ========================================================================
    const [buscandoCP, setBuscandoCP] = useState(false);
    const handleCodigoPostalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length > 4) valor = valor.substring(0, 4) + '-' + valor.substring(4, 7);
        setFormValues((prev: any) => ({ ...prev, postal_code: valor }));

        if (valor.length === 8) {
            setBuscandoCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${valor}`);
                if (res.ok) {
                    const data = await res.json();
                    const info = Array.isArray(data) ? data[0] : data;
                    if (info && !info.erro) {
                        setFormValues((prev: any) => ({
                            ...prev,
                            address_1: info.ruas ? info.ruas[0] : (info.rua || prev.address_1),
                            neighborhood: info.Freguesia || prev.neighborhood,
                            city: info.Designacao || info.Município || prev.city,
                            state: info.Distrito || prev.state
                        }));
                    }
                }
            } finally { setBuscandoCP(false); }
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewFoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // Validação básica para evitar erros silenciosos nas abas
        if (!formValues.first_name || !formValues.email || !formValues.password) {
            alert("⚠️ Por favor, preencha o Nome, E-mail e Senha na Aba 1.");
            setAbaAtiva(1);
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(formValues).forEach(key => {
                const value = formValues[key];
                if (value !== null && value !== undefined) {
                    formData.set(key, String(value));
                }
            });

            // Adicionar a foto se existir
            if (fileInputRef.current?.files?.[0]) {
                formData.set('avatar', fileInputRef.current.files[0]);
            }

            const result = (await criarNovoMembroAction(formData)) as any;
            if (result?.error || result?.erro) {
                alert("❌ " + (result.error || result.erro));
                setIsSubmitting(false);
            } else {
                router.push("/admin/membros?sucesso=true");
            }
        } catch (error) {
            setIsSubmitting(false);
            alert("❌ Erro ao comunicar com o servidor.");
        }
    }

    const abas = [
        { id: 1, label: 'Pessoal', icon: <User size={14} /> },
        { id: 2, label: 'Morada', icon: <MapPin size={14} /> },
        { id: 3, label: 'Eclesiástico', icon: <ShieldCheck size={14} /> },
        { id: 4, label: 'Família & Legal', icon: <Scale size={14} /> },
    ];

    return (
        <main className="max-w-5xl mx-auto space-y-10 py-10 px-6 animate-in fade-in">
            <Breadcrumb items={[{ label: "Membros", href: "/admin/membros" }, { label: "Novo Registo" }]} />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-soft pb-8 gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">Novo Membro</h1>
                    <p className="text-[10px] font-black text-figueira uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={12} /> {formValues.role} • {formValues.status}
                    </p>
                </div>
            </header>

            <nav className="flex flex-wrap gap-2 bg-bg2 p-2 rounded-[2.5rem] border border-soft shadow-sm">
                {abas.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setAbaAtiva(tab.id)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === tab.id ? "bg-fg text-bg shadow-xl scale-[1.02]" : "text-muted hover:bg-soft"}`}>
                        {tab.icon} <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20" noValidate>

                {/* ABA 1: PESSOAL (COM FOTO) */}
                <div className={abaAtiva === 1 ? 'block space-y-8 animate-in slide-in-from-right-4' : 'hidden'}>
                    <div className="bg-bg2 border border-soft p-8 rounded-[3rem] flex items-center gap-8 shadow-sm">
                        <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-soft shrink-0">
                            {previewFoto ? (
                                <Image src={previewFoto} alt="Preview" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted/20"><User size={40} /></div>
                            )}
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-fg text-bg p-2.5 rounded-xl shadow-lg hover:bg-figueira transition-all">
                                <Camera size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black uppercase italic text-fg">Fotografia de Perfil</h3>
                            <p className="text-[10px] font-bold text-muted uppercase">Importante para identificação e cartão de membro.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <Input label="Primeiro Nome" name="first_name" value={formValues.first_name} onChange={handleInputChange} required />
                        <Input label="Sobrenome" name="last_name" value={formValues.last_name} onChange={handleInputChange} required />
                        <Input label="E-mail" name="email" type="email" value={formValues.email} onChange={handleInputChange} required />
                        <Input label="Senha de Acesso" name="password" type="password" value={formValues.password} onChange={handleInputChange} required />
                        <Input label="Telemóvel" name="phone_1" value={formValues.phone_1} onChange={handleInputChange} required />
                        <Input label="Nascimento" name="birthdate" type="date" value={formValues.birthdate} onChange={handleInputChange} />
                        <Input label="NIF (Contribuinte)" name="tax_id" value={formValues.tax_id} onChange={handleInputChange} />
                        <Input label="Nacionalidade" name="nationality" value={formValues.nationality} onChange={handleInputChange} />
                        <Select label="Gênero" name="gender" value={formValues.gender} onChange={handleInputChange} options={['Masculino', 'Feminino', 'Outro']} />
                        <Select label="Estado Civil" name="marital_status" value={formValues.marital_status} onChange={handleInputChange} options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']} />
                        <Input label="Profissão" name="profession" value={formValues.profession} onChange={handleInputChange} />
                        <div className="space-y-1.5 lg:col-span-1">
                            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">Escolaridade</label>
                            <select name="escolaridade_id" value={formValues.escolaridade_id} onChange={handleInputChange} className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none">
                                <option value="">Selecione...</option>
                                <option value="1">Ensino Básico</option><option value="2">Ensino Secundário</option><option value="3">Licenciatura</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ABA 2: MORADA */}
                <div className={abaAtiva === 2 ? 'block space-y-6 animate-in slide-in-from-right-4' : 'hidden'}>
                    <div className="grid md:grid-cols-4 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <div className="md:col-span-1 relative">
                            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Cód. Postal (PT)</label>
                            <input name="postal_code" value={formValues.postal_code} onChange={handleCodigoPostalChange} placeholder="0000-000" maxLength={8} className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg outline-none" />
                            {buscandoCP && <Loader2 size={14} className="animate-spin text-figueira absolute right-4 top-10" />}
                        </div>
                        <Input label="Morada / Rua" name="address_1" value={formValues.address_1} onChange={handleInputChange} className="md:col-span-3" />
                        <Input label="Nº / Porta" name="address_number" value={formValues.address_number} onChange={handleInputChange} />
                        <Input label="Lote / Apart." name="address_2" value={formValues.address_2} onChange={handleInputChange} />
                        <Input label="Freguesia / Bairro" name="neighborhood" value={formValues.neighborhood} onChange={handleInputChange} />
                        <Input label="Cidade" name="city" value={formValues.city} onChange={handleInputChange} />
                        <Input label="Distrito" name="state" value={formValues.state} onChange={handleInputChange} />
                        <Input label="País" name="country" value={formValues.country} onChange={handleInputChange} />
                    </div>
                </div>

                {/* ABA 3: ECLESIÁSTICO */}
                <div className={abaAtiva === 3 ? 'block space-y-6 animate-in slide-in-from-right-4' : 'hidden'}>
                    <div className="grid md:grid-cols-3 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <div className="md:col-span-3 p-6 bg-figueira/5 border border-figueira/10 rounded-3xl space-y-4">
                            <p className="text-[10px] font-black uppercase text-fg flex items-center gap-2"><ShieldCheck size={16} className="text-figueira" /> Nível de Acesso</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['USER', 'LEADER', 'FINANCE', 'ADMIN'].map(r => (
                                    <button key={r} type="button" onClick={() => setFormValues({ ...formValues, role: r })} className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formValues.role === r ? 'bg-fg text-bg border-fg' : 'bg-bg text-muted border-soft'}`}>{r}</button>
                                ))}
                            </div>
                        </div>
                        <Input label="Data de Admissão" name="admission_date" type="date" value={formValues.admission_date} onChange={handleInputChange} />
                        <Input label="Data de Batismo" name="baptism_date" type="date" value={formValues.baptism_date} onChange={handleInputChange} />
                        <Input label="Data de Conversão" name="conversion_date" type="date" value={formValues.conversion_date} onChange={handleInputChange} />
                        <Select label="Cargo" name="church_role" value={formValues.church_role} onChange={handleInputChange} options={cargos.map(c => c.nome)} />
                        <Select label="Status" name="status" value={formValues.status} onChange={handleInputChange} options={['ATIVO', 'INATIVO', 'VISITANTE', 'PENDENTE']} />
                        <Input label="ID Loyverse" name="loyverse_id" value={formValues.loyverse_id} onChange={handleInputChange} />
                        <div className="md:col-span-3">
                            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">Notas Pastorais</label>
                            <textarea name="notes" rows={4} value={formValues.notes} onChange={handleInputChange} className="w-full bg-bg border border-soft rounded-[2rem] p-5 text-[11px] font-bold text-fg outline-none resize-none" />
                        </div>
                    </div>
                </div>

                {/* ABA 4: FAMÍLIA & LEGAL */}
                <div className={abaAtiva === 4 ? 'block space-y-6 animate-in slide-in-from-right-4' : 'hidden'}>
                    <div className="grid md:grid-cols-2 gap-6 bg-bg2 border border-soft p-10 rounded-[3rem] shadow-xl">
                        <Input label="Nome do Pai" name="father_name" value={formValues.father_name} onChange={handleInputChange} />
                        <Input label="Nome da Mãe" name="mother_name" value={formValues.mother_name} onChange={handleInputChange} />
                        <Input label="Nome do Cônjuge" name="spouse_name" value={formValues.spouse_name} onChange={handleInputChange} />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Tem Filhos?" name="has_children" value={temFilhos} onChange={(e: any) => setTemFilhos(e.target.value)} options={[{ label: 'Sim', value: 'true' }, { label: 'Não', value: 'false' }]} />
                            {temFilhos === 'true' && <Input label="Quantos?" name="children_count" type="number" value={formValues.children_count} onChange={handleInputChange} />}
                        </div>

                        <div className="md:col-span-2 border-t border-soft pt-6 mt-4 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-fg flex items-center gap-2"><Scale size={16} className="text-figueira" /> Termos Legais</h4>
                            <div className="bg-bg p-6 rounded-[2rem] border border-soft space-y-4">
                                <label className="flex items-start gap-4 cursor-pointer">
                                    <input type="checkbox" name="gdpr_aceite" checked={formValues.gdpr_aceite} onChange={handleInputChange} className="mt-1 w-5 h-5 accent-figueira" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-fg">Autorização GDPR</p>
                                        <p className="text-[9px] text-muted font-bold">Autorizo o tratamento de dados para fins pastorais.</p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-4 cursor-pointer">
                                    <input type="checkbox" name="permanecer_aceite" checked={formValues.permanecer_aceite} onChange={handleInputChange} className="mt-1 w-5 h-5 accent-figueira" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-fg">Termo Permanecer</p>
                                        <p className="text-[9px] text-muted font-bold">Concordo com a visão e regras de conduta da ADMVC.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NAVEGAÇÃO E BOTÕES DE AÇÃO */}
                <div className="flex justify-between items-center bg-bg2 p-4 rounded-[2.5rem] border border-soft shadow-inner sticky bottom-4 z-10">

                    {/* Botão Anterior: Oculto na primeira aba */}
                    <button
                        type="button"
                        disabled={abaAtiva === 1}
                        onClick={() => setAbaAtiva(a => a - 1)}
                        className={`px-8 flex items-center gap-2 text-[10px] font-black uppercase text-muted hover:text-fg transition-all ${abaAtiva === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeft size={14} /> Anterior
                    </button>

                    {/* Lógica de Botão Direito: Próximo (1, 2, 3) vs Finalizar (4) */}
                    {abaAtiva < 4 ? (
                        <button
                            type="button"
                            onClick={() => setAbaAtiva(a => a + 1)}
                            className="bg-fg text-bg px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-figueira transition-all flex items-center gap-2"
                        >
                            Próximo Passo <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2 ${isSubmitting ? 'bg-muted text-bg cursor-wait' : 'bg-figueira text-white hover:bg-figueira/90 active:scale-95'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    A Processar...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Finalizar Cadastro
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </main>
    );
}

// Componentes auxiliares consistentes com o seu Editor
function Input({ label, className, ...props }: any) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <input {...props} className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm" />
        </div>
    )
}

function Select({ label, options, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <select {...props} className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none appearance-none cursor-pointer">
                <option value="">Selecione...</option>
                {options.map((opt: any) => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                    </option>
                ))}
            </select>
        </div>
    )
}