"use client"
import { useState, useEffect, useRef } from 'react'
import { atualizarMembroAdmin } from '@/actions/admin-actions' // Confirme se o caminho bate certo com a sua estrutura
import {
    User, MapPin, Church, Users2, Save,
    Check, ChevronRight, ArrowLeft, Camera, Loader2, Lock, ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function EditarMembroClient({
    membro,
    todosDeptos,
    todosGrupos,
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
        neighborhood: membro.neighborhood || '', // Nota: No backend salva como address_2 se quiser
        city: membro.city || '',                 // Nota: No backend salva como id_city se quiser
        country: membro.country || 'Portugal'
    })

    const handleCodigoPostalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value.replace(/\D/g, '');

        if (valor.length > 4) {
            valor = valor.substring(0, 4) + '-' + valor.substring(4, 7);
        }

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

    return (
        <main className="max-w-5xl mx-auto p-6 pb-20">
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
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-soft pb-8">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-figueira font-black text-[10px] uppercase tracking-[0.4em]">Gestão de Membresia</span>
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

                {/* TABS */}
                <nav className="flex flex-wrap gap-2 border-b border-soft pb-4 sticky top-0 bg-bg/90 backdrop-blur-md z-30 pt-4">
                    {[
                        { id: 'pessoal', label: 'Pessoal', icon: <User size={14} /> },
                        { id: 'endereco', label: 'Endereço', icon: <MapPin size={14} /> },
                        { id: 'eclesiastico', label: 'Eclesiástico', icon: <Church size={14} /> },
                        { id: 'familia', label: 'Família', icon: <Users2 size={14} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAbaAtiva(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${abaAtiva === tab.id ? 'bg-figueira text-white shadow-lg' : 'bg-bg2 text-muted border border-soft hover:bg-soft'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="bg-bg2 border border-soft rounded-[3rem] p-8 md:p-12 shadow-sm min-h-[500px]">

                    {/* ABA PESSOAL */}
                    <div className={abaAtiva === 'pessoal' ? 'block space-y-8 animate-in fade-in' : 'hidden'}>
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
                                <h4 className="text-lg font-black uppercase italic text-fg">Dados de Identificação</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Gerencie as informações básicas do membro.</p>
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

                            {/* SELECT DE ESCOLARIDADE */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4">Escolaridade</label>
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

                            {/* DATA DE CONVERSÃO */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4">Data de Conversão</label>
                                <input
                                    type="date"
                                    name="conversion_date"
                                    defaultValue={formatDate(membro.conversion_date)}
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* BLOCO DE SENHA ISOLADO */}
                        <div className="mt-4 pt-6 border-t border-soft/50">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-4">
                                <Lock size={14} className="text-figueira" /> Alterar Senha (Opcional)
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Input
                                    label="Nova Senha"
                                    name="nova_senha"         // AQUI ESTÁ A CORREÇÃO MESTRA 1
                                    type="password"
                                    autoComplete="new-password"
                                    defaultValue=""
                                    placeholder="Deixe em branco para manter a atual..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ABA ENDEREÇO (COM AUTO-PREENCHIMENTO) */}
                    <div className={abaAtiva === 'endereco' ? 'block grid md:grid-cols-4 gap-6 animate-in fade-in' : 'hidden'}>
                        {/* CÓDIGO POSTAL */}
                        <div className="space-y-2 md:col-span-1 relative">
                            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Código Postal</label>
                            <input
                                name="postal_code"
                                value={endereco.postal_code}
                                onChange={handleCodigoPostalChange}
                                maxLength={8}
                                placeholder="XXXX-YYY"
                                className={`w-full bg-bg border ${buscandoCP ? 'border-figueira/50 bg-figueira/5' : 'border-soft'} rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm`}
                            />
                            {buscandoCP && <Loader2 size={14} className="animate-spin text-figueira absolute right-4 top-[38px]" />}
                        </div>

                        {/* MORADA */}
                        <div className="md:col-span-3">
                            <Input
                                label="Morada / Rua"
                                name="address_1"
                                value={endereco.address_1}
                                onChange={(e: any) => setEndereco({ ...endereco, address_1: e.target.value })}
                            />
                        </div>

                        <Input label="Nº / Andar" name="address_number" defaultValue={membro.address_number} />

                        {/* BAIRRO E CIDADE E PAÍS */}
                        <Input
                            label="Freguesia / Bairro"
                            name="neighborhood"
                            value={endereco.neighborhood}
                            onChange={(e: any) => setEndereco({ ...endereco, neighborhood: e.target.value })}
                        />
                        <Input
                            label="Cidade / Município"
                            name="id_city"
                            value={endereco.city}
                            onChange={(e: any) => setEndereco({ ...endereco, city: e.target.value })}
                        />
                        <Input
                            label="País"
                            name="country"
                            value={endereco.country}
                            onChange={(e: any) => setEndereco({ ...endereco, country: e.target.value })}
                        />
                    </div>

                    {/* ABA ECLESIÁSTICO */}
                    <div className={abaAtiva === 'eclesiastico' ? 'block space-y-8 animate-in fade-in' : 'hidden'}>
                        {isAdmin && (
                            <div className="p-6 bg-figueira/5 border border-figueira/10 rounded-3xl space-y-6">
                                <div className="flex items-center justify-between border-b border-figueira/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-figueira" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-figueira">Acesso Administrativo</span>
                                    </div>

                                    {/* AQUI ESTÁ A CORREÇÃO MESTRA 2: CHECKBOX IS_ACTIVE */}
                                    <label className="flex items-center gap-2 cursor-pointer group bg-white/50 px-4 py-2 rounded-xl border border-figueira/20 hover:bg-white transition-all">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            defaultChecked={membro.is_active}
                                            className="w-4 h-4 accent-figueira cursor-pointer"
                                        />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-fg group-hover:text-figueira transition-colors">
                                            Acesso ao Sistema Permitido
                                        </span>
                                    </label>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Select
                                        label="Nível de Acesso (Role)"
                                        name="role"
                                        defaultValue={membro.role}
                                        options={roles}
                                    />
                                    <Input
                                        label="ID Loyverse (Cantina)"
                                        name="loyverse_id"
                                        defaultValue={membro.loyverse_id}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Data Admissão" name="entry_date" type="date" defaultValue={formatDate(membro.entry_date)} />
                            <Input label="Data Batismo" name="baptism_date" type="date" defaultValue={formatDate(membro.baptism_date)} />
                            <Input label="Cargo" name="church_role" defaultValue={membro.church_role} />

                            <Select
                                label="Status"
                                name="status"
                                defaultValue={membro.status}
                                options={[
                                    { label: 'Ativo', value: 'ATIVO' },
                                    { label: 'Inativo', value: 'INATIVO' },
                                    { label: 'Visitante', value: 'VISITANTE' },
                                    { label: 'Pendente', value: 'PENDENTE' }
                                ]}
                            />
                        </div>
                    </div>

                    {/* ABA FAMÍLIA */}
                    <div className={abaAtiva === 'familia' ? 'block grid md:grid-cols-2 gap-6 animate-in fade-in' : 'hidden'}>
                        <Input label="Nome do Cônjuge" name="spouse_name" defaultValue={membro.spouse_name} />
                        <Input label="Nº de Filhos" name="children_number" type="number" defaultValue={membro.children_number || 0} />
                    </div>
                </div>
            </form>
        </main>
    )
}

/* COMPONENTES DE SUPORTE */
function Input({ label, className, value, onChange, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <input
                value={value}
                onChange={onChange}
                {...props}
                className={`w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm ${className}`}
            />
        </div>
    )
}

function Select({ label, options, defaultValue, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <select
                {...props}
                defaultValue={defaultValue}
                className="w-full bg-bg border border-soft rounded-2xl p-4 text-[11px] font-bold text-fg focus:border-figueira outline-none appearance-none cursor-pointer"
            >
                {options.map((opt: any) => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const label = typeof opt === 'string' ? opt : opt.label;
                    return <option key={value} value={value}>{label}</option>
                })}
            </select>
        </div>
    )
}

function ShieldCheck({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
        </svg>
    )
}