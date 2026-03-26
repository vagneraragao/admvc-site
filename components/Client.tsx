"use client"

import { useState, useEffect, useRef } from 'react'
import { atualizarMembroAdmin } from '@/actions/admin-actions'
import {
    User, MapPin, Users2, Save, Church, FileSignature, AlertCircle,
    Check, ChevronRight, ArrowLeft, Camera, Loader2, Lock, ShieldAlert, Home, CheckCircle2, XCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function EditarMembroClient({
    membro,
    roles = [],
    isAdmin = false,
    escolaridades = []
}: any) {
    const [isPending, setIsPending] = useState(false)
    const [mostrarSucesso, setMostrarSucesso] = useState(false)
    const [abaAtiva, setAbaAtiva] = useState('pessoal')

    const [previewFoto, setPreviewFoto] = useState(membro.avatar_file || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ========================================================================
    // MAGIA DO CÓDIGO POSTAL (PORTUGAL - GEOAPI.PT)
    // ========================================================================
    const [buscandoCP, setBuscandoCP] = useState(false)
    const [endereco, setEndereco] = useState({
        postal_code: membro.postal_code || '',
        address_1: membro.address_1 || '',
        neighborhood: membro.neighborhood || '',
        city: membro.id_city || membro.city || '',
        country: membro.country || 'Portugal'
    })

    const handleCodigoPostalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length > 4) valor = valor.substring(0, 4) + '-' + valor.substring(4, 7);
        setEndereco(prev => ({ ...prev, postal_code: valor }));

        if (valor.length === 8) {
            setBuscandoCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${valor}`);
                if (res.ok) {
                    const data = await res.json();
                    const info = Array.isArray(data) ? data[0] : data;
                    if (info && !info.erro) {
                        setEndereco(prev => ({
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
                setBuscandoCP(false);
            }
        }
    }

    const formatDate = (date: any) => date ? new Date(date).toISOString().split('T')[0] : ''

    useEffect(() => {
        if (mostrarSucesso) {
            const timer = setTimeout(() => setMostrarSucesso(false), 4000)
            return () => clearTimeout(timer)
        }
    }, [mostrarSucesso])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPreviewFoto(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    async function handleAction(formData: FormData) {
        setIsPending(true)
        const res = await atualizarMembroAdmin(membro.id, formData)
        setIsPending(false)

        if (res.ok) {
            setMostrarSucesso(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            alert(res.error || "Erro ao atualizar.")
        }
    }

    // Função auxiliar para os cartões de Documentos (Leitura)
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
                        {ok && validade ? `Válido até ${new Date(validade).toLocaleDateString('pt-PT')}` : ok ? 'Assinado' : 'Pendente / Expirado'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <main className="max-w-5xl mx-auto p-4 sm:p-6 pb-20 animate-in fade-in duration-700">
            <form action={handleAction} className="space-y-8">
                <input type="hidden" name="id" value={membro.id} />

                {/* BREADCRUMBS */}
                <nav className="flex items-center gap-4 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    <Link href="/admin/membros" className="hover:text-figueira transition-colors flex items-center gap-2">
                        <ArrowLeft size={12} strokeWidth={3} /> Voltar à Lista
                    </Link>
                    <ChevronRight size={10} className="opacity-30" />
                    <span className="text-fg italic">Editar Perfil</span>
                </nav>

                {/* HEADER */}
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-soft pb-8">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-figueira font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                                <ShieldAlert size={14} /> Painel Administrativo
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                                Editar <span className="text-muted/20">Membro.</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                        {mostrarSucesso && (
                            <div className="flex items-center gap-3 text-green-500 bg-green-500/10 px-5 py-3 rounded-2xl border border-green-500/20 animate-in fade-in duration-300">
                                <Check size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Atualizado com sucesso!</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full md:w-auto flex items-center justify-center gap-3 bg-fg text-bg px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isPending ? "A GUARDAR..." : "CONFIRMAR EDIÇÃO"}
                        </button>
                    </div>
                </header>

                {/* 1. BANNER FAMÍLIA E COMPLIANCE */}
                <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-sm">
                    {/* Bloco Família */}
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
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Sem Família</h3>
                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">Nenhum vínculo registado</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="hidden lg:block w-[1px] h-12 bg-soft mx-2"></div>

                    {/* Bloco Compliance (GDPR e Permanecer) */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <StatusDoc nome="Acordo GDPR" aceite={membro.gdpr_aceite} validade={membro.gdpr_validade} />
                        <StatusDoc nome="Termo Permanecer" aceite={membro.permanecer_aceite} validade={membro.permanecer_validade} />
                    </div>
                </div>

                {/* TABS DE NAVEGAÇÃO */}
                <nav className="flex flex-wrap gap-2 border-b border-soft pb-4 sticky top-0 bg-bg/90 backdrop-blur-md z-30 pt-4">
                    {[
                        { id: 'pessoal', label: 'Dados Pessoais', icon: <User size={14} /> },
                        { id: 'endereco', label: 'Morada', icon: <MapPin size={14} /> },
                        { id: 'familia', label: 'Relações & Docs', icon: <Users2 size={14} /> },
                        { id: 'eclesiastico', label: 'Eclesiástico', icon: <Church size={14} /> },
                        { id: 'administrativo', label: 'Administrativo', icon: <Lock size={14} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAbaAtiva(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === tab.id ? 'bg-fg text-bg shadow-lg' : 'bg-bg2 text-muted border border-soft hover:bg-soft hover:text-fg'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                {/* CONTAINER DOS DADOS */}
                <div className="bg-bg2 border border-soft rounded-[3rem] p-8 md:p-12 shadow-sm min-h-[500px]">

                    {/* ========================================================= */}
                    {/* ABA 1: PESSOAL                                            */}
                    {/* ========================================================= */}
                    <div className={abaAtiva === 'pessoal' ? 'block space-y-8 animate-in fade-in slide-in-from-bottom-4' : 'hidden'}>
                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-soft/50">
                            <div className="relative group shrink-0">
                                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-soft relative">
                                    {previewFoto ? (
                                        <Image src={previewFoto} alt="Perfil" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted bg-bg"><User size={40} /></div>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-fg text-bg p-2.5 rounded-xl shadow-xl hover:bg-figueira transition-all">
                                    <Camera size={16} strokeWidth={3} />
                                </button>
                                <input type="file" name="avatar" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase italic text-fg">Dados Pessoais</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Identificação e contactos básicos.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Primeiro Nome" name="first_name" defaultValue={membro.first_name} required />
                            <Input label="Sobrenome" name="last_name" defaultValue={membro.last_name} required />
                            <Input label="E-mail" name="email" type="email" defaultValue={membro.email} required />
                            <Input label="Telemóvel" name="phone_1" defaultValue={membro.phone_1} />
                            <Input label="Nascimento" name="birthdate" type="date" defaultValue={formatDate(membro.birthdate)} />
                            <Select label="Gênero" name="gender" defaultValue={membro.gender} options={['Masculino', 'Feminino']} />
                            <Input label="Profissão" name="profession" defaultValue={membro.profession} />
                            <Input label="Nome do Pai" name="father_name" defaultValue={membro.father_name} />
                            <Input label="Nome da Mãe" name="mother_name" defaultValue={membro.mother_name} />

                            <div className="space-y-1.5 lg:col-span-3">
                                <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4">Nível de Escolaridade</label>
                                <select
                                    name="escolaridade_id"
                                    defaultValue={membro?.escolaridade_id || ""}
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione...</option>
                                    {escolaridades.map((esc: any) => (
                                        <option key={esc.id} value={esc.id}>{esc.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-soft">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-6">
                                <Lock size={14} className="text-figueira" /> Alterar Senha do Membro
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Input
                                    label="Nova Senha"
                                    name="nova_senha"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Deixe em branco para manter a atual"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* ABA 2: MORADA (ORDEM ESPECÍFICA)                          */}
                    {/* ========================================================= */}
                    <div className={abaAtiva === 'endereco' ? 'block animate-in fade-in slide-in-from-bottom-4' : 'hidden'}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-8 pb-4 border-b border-soft">
                            <MapPin size={14} className="text-figueira" /> Endereço Residencial
                        </h4>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Morada 1 (Rua/Avenida)" name="address_1" value={endereco.address_1} onChange={(e: any) => setEndereco({ ...endereco, address_1: e.target.value })} className="md:col-span-2 lg:col-span-3" />
                            <Input label="Morada 2 (Complemento)" name="address_2" defaultValue={membro.address_2} className="md:col-span-2" />
                            <Input label="Número / Lote" name="address_number" defaultValue={membro.address_number} />

                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Código Postal</label>
                                <input
                                    name="postal_code"
                                    value={endereco.postal_code}
                                    onChange={handleCodigoPostalChange}
                                    maxLength={8}
                                    placeholder="Ex: 4000-123"
                                    className={`w-full bg-bg border ${buscandoCP ? 'border-figueira/50 bg-figueira/5' : 'border-soft'} rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm`}
                                />
                                {buscandoCP && <Loader2 size={14} className="animate-spin text-figueira absolute right-4 top-[38px]" />}
                            </div>

                            <Input label="Cidade / Município" name="id_city" value={endereco.city} onChange={(e: any) => setEndereco({ ...endereco, city: e.target.value })} />
                            <Input label="Distrito / Estado" name="state" defaultValue={membro.state} />
                            <Input label="País" name="country" value={endereco.country} onChange={(e: any) => setEndereco({ ...endereco, country: e.target.value })} />
                            <Input label="Freguesia / Bairro" name="neighborhood" value={endereco.neighborhood} onChange={(e: any) => setEndereco({ ...endereco, neighborhood: e.target.value })} className="md:col-span-2" />
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* ABA 3: FAMÍLIA E DOCUMENTOS (ORDEM ESPECÍFICA)            */}
                    {/* ========================================================= */}
                    <div className={abaAtiva === 'familia' ? 'block animate-in fade-in slide-in-from-bottom-4' : 'hidden'}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-8 pb-4 border-b border-soft">
                            <Users2 size={14} className="text-figueira" /> Documentação e Relações
                        </h4>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Select label="Estado Civil" name="marital_status" defaultValue={membro.marital_status} options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União de Facto']} />
                            <Input label="Nacionalidade" name="nationality" defaultValue={membro.nationality} />
                            <Input label="NIF / CPF (Identificação Fiscal)" name="tax_id" defaultValue={membro.tax_id} />
                            <Input label="Cartão de Cidadão / RG" name="id_card_number" defaultValue={membro.id_card_number} />
                            <Input label="Idioma Preferencial" name="lang" defaultValue={membro.lang || 'pt'} />
                            <Input label="Nome do Cônjuge" name="spouse_name" defaultValue={membro.spouse_name} />
                            <Select label="Cônjuge é Cristão?" name="spouse_christian" defaultValue={membro.spouse_christian ? "true" : "false"} options={[{ label: 'Sim', value: 'true' }, { label: 'Não', value: 'false' }]} />
                            <Input label="Data de Casamento" name="wedding_date" type="date" defaultValue={formatDate(membro.wedding_date)} />
                            <Select label="Tem Filhos?" name="has_children" defaultValue={membro.has_children ? "true" : "false"} options={[{ label: 'Sim', value: 'true' }, { label: 'Não', value: 'false' }]} />
                            <Input label="Número de Filhos" name="children_number" type="number" min="0" defaultValue={membro.children_number || 0} />
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* ABA 4: ECLESIÁSTICO                                       */}
                    {/* ========================================================= */}
                    <div className={abaAtiva === 'eclesiastico' ? 'block animate-in fade-in slide-in-from-bottom-4' : 'hidden'}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-8 pb-4 border-b border-soft">
                            <Church size={14} className="text-figueira" /> Jornada Espiritual
                        </h4>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Data de Entrada na Igreja" name="entry_date" type="date" defaultValue={formatDate(membro.entry_date)} />
                            <Input label="Data de Batismo" name="baptism_date" type="date" defaultValue={formatDate(membro.baptism_date)} />
                            <Input label="Data de Conversão" name="conversion_date" type="date" defaultValue={formatDate(membro.conversion_date)} />

                            <div className="md:col-span-2 lg:col-span-3 space-y-2 mt-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Testemunho / Notas</label>
                                <textarea
                                    name="notes"
                                    rows={4}
                                    defaultValue={membro.notes}
                                    className="w-full bg-bg border border-soft rounded-3xl p-5 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-soft">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-6">
                                <ArrowLeft size={14} className="text-figueira" /> Histórico Prévio (Outras Igrejas)
                            </h4>
                            <div className="grid md:grid-cols-3 gap-6">
                                <Input label="Igreja Anterior" name="previous_church" defaultValue={membro.previous_church} />
                                <Input label="Cargo que exercia" name="church_role" defaultValue={membro.church_role} placeholder="Ex: Membro, Diácono..." />
                                <Input label="Ministério de atuação" name="ministry" defaultValue={membro.ministry} placeholder="Ex: Louvor, Jovens..." />
                            </div>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* ABA 5: ADMINISTRATIVO (EDITÁVEL PELO ADMIN)               */}
                    {/* ========================================================= */}
                    <div className={abaAtiva === 'administrativo' ? 'block animate-in fade-in slide-in-from-bottom-4' : 'hidden'}>
                        <div className="bg-figueira/5 border border-figueira/10 rounded-3xl p-6 md:p-8 space-y-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-figueira/10 pb-6">
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-figueira flex items-center gap-2">
                                        <ShieldAlert size={18} /> Controlo de Acessos
                                    </h4>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-1">
                                        Altere permissões, cargos no sistema e integrações.
                                    </p>
                                </div>

                                {/* CHECKBOX IS_ACTIVE (Acesso ao sistema) */}
                                <label className="flex items-center gap-3 cursor-pointer group bg-white/60 px-5 py-3 rounded-xl border border-figueira/20 hover:bg-white transition-all shadow-sm">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        defaultChecked={membro.is_active}
                                        className="w-5 h-5 accent-figueira cursor-pointer"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-fg group-hover:text-figueira transition-colors">
                                        Acesso ao Sistema Permitido
                                    </span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <Select
                                    label="Nível de Permissão (Role)"
                                    name="role"
                                    defaultValue={membro.role}
                                    options={roles.length > 0 ? roles : ['USER', 'ADMIN', 'FINANCE']}
                                />
                                <Select
                                    label="Status de Cadastro"
                                    name="status"
                                    defaultValue={membro.status}
                                    options={[
                                        { label: 'Ativo', value: 'ATIVO' },
                                        { label: 'Inativo', value: 'INATIVO' },
                                        { label: 'Visitante', value: 'VISITANTE' },
                                        { label: 'Pendente', value: 'PENDENTE' },
                                        { label: 'Arquivado', value: 'ARQUIVADO' }
                                    ]}
                                />
                                <Input
                                    label="ID Loyverse (Cantina)"
                                    name="loyverse_id"
                                    defaultValue={membro.loyverse_id}
                                    placeholder="Ex: a1b2c3d4..."
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </main>
    )
}

/* ============================================================================
   COMPONENTES DE SUPORTE MINIMALISTAS
   ============================================================================ */
function Input({ label, className, value, onChange, readOnly, title, ...props }: any) {
    return (
        <div className="space-y-1.5" title={title}>
            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest flex items-center gap-2">
                {label} {readOnly && <Lock size={8} className="text-figueira opacity-50" />}
            </label>
            <input
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                {...props}
                className={`w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm ${readOnly ? 'focus:border-soft bg-soft/30 cursor-not-allowed' : ''} ${className}`}
            />
        </div>
    )
}

function Select({ label, options, defaultValue, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <select
                {...props}
                defaultValue={defaultValue}
                className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none appearance-none cursor-pointer shadow-sm"
            >
                <option value="">Selecione...</option>
                {options.map((opt: any) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return <option key={value} value={value}>{label}</option>
                })}
            </select>
        </div>
    )
}