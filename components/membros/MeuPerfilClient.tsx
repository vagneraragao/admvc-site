"use client"
import { useState, useEffect, useRef } from 'react'
import { atualizarDadosMembro } from '@/actions/membro-actions' // Confirme o caminho da sua action de membro
import {
    User, MapPin, Users2, Save,
    Check, ChevronRight, ArrowLeft, Camera, Loader2, Lock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function MeuPerfilClient({
    membro,
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
        // Chama a função específica para o membro atualizar os próprios dados
        const res = await atualizarDadosMembro(membro.id, formData)
        setIsPending(false)

        if (res.sucesso) {
            setMostrarSucesso(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            alert(res.erro || "Erro ao atualizar.")
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-6 pb-20">
            <form action={handleAction} className="space-y-8">
                {/* BREADCRUMBS */}
                <nav className="flex items-center gap-4 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                    <Link href="/membros/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                        <ArrowLeft size={12} strokeWidth={3} /> Voltar à Dashboard
                    </Link>
                    <ChevronRight size={10} className="opacity-30" />
                    <span className="text-fg italic">O Meu Perfil</span>
                </nav>

                {/* HEADER */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-soft pb-8">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-figueira font-black text-[10px] uppercase tracking-[0.4em]">Área Pessoal</span>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                                O Meu <span className="text-muted/20">Perfil.</span>
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
                            {isPending ? "A GUARDAR..." : "GUARDAR ALTERAÇÕES"}
                        </button>
                    </div>
                </header>

                {/* TABS (Sem a aba Eclesiástica) */}
                <nav className="flex flex-wrap gap-2 border-b border-soft pb-4 sticky top-0 bg-bg/90 backdrop-blur-md z-30 pt-4">
                    {[
                        { id: 'pessoal', label: 'Dados Pessoais', icon: <User size={14} /> },
                        { id: 'endereco', label: 'Morada', icon: <MapPin size={14} /> },
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
                                <h4 className="text-lg font-black uppercase italic text-fg">Os Meus Dados</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Mantenha as suas informações atualizadas.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Primeiro Nome" name="first_name" defaultValue={membro.first_name} required />
                            <Input label="Sobrenome" name="last_name" defaultValue={membro.last_name} required />

                            {/* AQUI ESTÁ A MAGIA DO EMAIL BLOQUEADO */}
                            <Input
                                label="E-mail (Não Editável)"
                                name="email"
                                type="email"
                                defaultValue={membro.email}
                                readOnly
                                className="bg-soft/30 text-muted cursor-not-allowed border-dashed focus:border-soft"
                                title="Para alterar o seu e-mail, contacte a secretaria da igreja."
                            />

                            <Input label="Telemóvel" name="phone_1" defaultValue={membro.phone_1} />
                            <Input label="Nascimento" name="birthdate" type="date" defaultValue={formatDate(membro.birthdate)} />
                            <Select label="Gênero" name="gender" defaultValue={membro.gender} options={['Masculino', 'Feminino']} />
                            <Input label="Profissão" name="profession" defaultValue={membro.profession} />
                            <Input label="Nome do Pai" name="father_name" defaultValue={membro.father_name} />
                            <Input label="Nome da Mãe" name="mother_name" defaultValue={membro.mother_name} />

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

                        {/* BLOCO DE SENHA */}
                        <div className="mt-4 pt-6 border-t border-soft/50">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 mb-4">
                                <Lock size={14} className="text-figueira" /> Alterar Senha
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Input
                                    label="Nova Senha"
                                    name="nova_senha"
                                    type="password"
                                    autoComplete="new-password"
                                    defaultValue=""
                                    placeholder="Deixe em branco para não alterar"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ABA ENDEREÇO */}
                    <div className={abaAtiva === 'endereco' ? 'block grid md:grid-cols-4 gap-6 animate-in fade-in' : 'hidden'}>
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

                        <div className="md:col-span-3">
                            <Input
                                label="Morada / Rua"
                                name="address_1"
                                value={endereco.address_1}
                                onChange={(e: any) => setEndereco({ ...endereco, address_1: e.target.value })}
                            />
                        </div>

                        <Input label="Nº / Andar" name="address_number" defaultValue={membro.address_number} />

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
function Input({ label, className, value, onChange, readOnly, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">{label}</label>
            <input
                value={value}
                onChange={onChange}
                readOnly={readOnly}
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