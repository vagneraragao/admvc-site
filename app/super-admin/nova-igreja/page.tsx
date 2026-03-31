'use client'

import { useState } from 'react'
import { criarNovaIgreja } from '@/actions/super-admin-actions'
import { PlusCircle, Loader2, CheckCircle2, Building } from 'lucide-react'

export default function NovaIgrejaPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setStatus(null);

        const res = await criarNovaIgreja(formData);

        if (res?.error) {
            setStatus({ type: 'error', msg: res.error });
        } else if (res?.success) {
            setStatus({ type: 'success', msg: res.message! });
            // Opcional: limpar o formulário aqui
        }

        setLoading(false);
    }

    return (
        <main className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl bg-bg2 border border-soft p-10 rounded-[3rem] shadow-2xl space-y-8">

                <div className="flex items-center gap-4 border-b border-soft pb-6">
                    <div className="bg-figueira/20 p-4 rounded-full text-figueira">
                        <Building size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-fg">Nova Organização</h1>
                        <p className="text-xs font-bold text-muted uppercase tracking-widest">Registrar nova Igreja e Admin</p>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dados da Igreja */}
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase text-figueira tracking-[0.2em]">1. Dados da Igreja</h2>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Nome da Igreja</label>
                                <input name="nomeIgreja" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs outline-none focus:border-figueira" placeholder="Ex: Assembleia Central" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Identificador (Slug)</label>
                                <input name="slug" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs outline-none focus:border-figueira" placeholder="Ex: assembleia-central" />
                            </div>
                        </div>

                        {/* Dados do Admin */}
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase text-figueira tracking-[0.2em]">2. Conta do Administrador</h2>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Nome do Responsável</label>
                                <input name="adminNome" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs outline-none focus:border-figueira" placeholder="Nome do Pastor/Líder" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">E-mail de Acesso</label>
                                <input name="adminEmail" type="email" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs outline-none focus:border-figueira" placeholder="admin@igreja.pt" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Palavra-passe Provisória</label>
                                <input name="adminPassword" type="password" required className="w-full bg-bg border border-soft rounded-2xl px-4 py-3 text-xs outline-none focus:border-figueira" placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    {status && (
                        <div className={`flex items-center gap-2 text-xs font-black uppercase p-4 rounded-2xl ${status.type === 'error' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                            {status.type === 'error' ? '❌ ' : <CheckCircle2 size={16} />}
                            {status.msg}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${loading ? 'bg-muted text-bg cursor-wait' : 'bg-fg text-bg hover:bg-figueira'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                        {loading ? 'A processar...' : 'Criar Igreja e Gerar Acesso'}
                    </button>
                </form>
            </div>
        </main>
    )
}