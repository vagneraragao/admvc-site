// app/boasvindas/page.tsx
'use client'

import { useState } from 'react'
import { HeartHandshake, Sparkles, Send, CheckCircle2, Loader2, PlayCircle } from 'lucide-react'
import { registarVisitante } from '@/actions/visitante-actions'

export default function BemVindoPage() {
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)

    async function handleAction(formData: FormData) {
        setLoading(true)
        // Adicionamos um identificador silencioso no início da mensagem
        const originalMsg = formData.get('pedido_oracao') as string;
        formData.set('pedido_oracao', `🌱 [NOVO VISITANTE]\n${originalMsg || 'Sem pedido específico.'}`);

        const res = await registarVisitante(formData)
        setLoading(false)
        if (res.ok) setSucesso(true)
    }

    if (sucesso) {
        return (
            <main className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
                <div className="space-y-6 animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Que bom ter-te <br /><span className="text-figueira">connosco!</span>
                    </h1>
                    <p className="text-muted text-sm uppercase tracking-widest font-bold max-w-sm mx-auto leading-relaxed">
                        Recebemos os teus dados e o teu pedido de oração. Sê muito bem-vindo, volta sempre, ou melhor... <span className="text-fg font-black">fica para sempre!</span>
                    </p>

                    {/* Botão para o Vídeo no ecrã de sucesso */}
                    <a
                        href="https://youtu.be/rHNERaeiZPs?si=m0kmcrjyUWSshTxw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 inline-flex items-center justify-center gap-3 bg-figueira text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-figueira/20 active:scale-95"
                    >
                        <PlayCircle size={18} />
                        Conhece a Nossa Igreja
                    </a>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-bg2 border border-soft p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Efeito de Fundo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-figueira/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

                <div className="relative z-10 space-y-8">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-figueira text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg mb-6 shadow-figueira/30">
                            <HeartHandshake size={32} />
                        </div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg leading-none">
                            Bem-vindo à <br /> nossa casa.
                        </h1>
                        <p className="text-[11px] text-muted font-bold uppercase tracking-widest pt-2 leading-relaxed">
                            Sê muito bem-vindo! Volta sempre, ou melhor... <span className="text-figueira font-black">fica para sempre!</span>
                        </p>
                    </div>

                    <form action={handleAction} className="space-y-5">
                        {/* CAMPO DE E-MAIL (Faltava este!) */}

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4">Como te chamas?</label>
                            <input name="nome" required placeholder="O teu nome..." className="w-full bg-bg border border-soft rounded-2xl p-4 text-sm font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4">Telemóvel / WhatsApp</label>
                            <input name="telefone" type="tel" required placeholder="O teu contacto..." className="w-full bg-bg border border-soft rounded-2xl p-4 text-sm font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-4 flex items-center gap-2">
                                Pedido de Oração <Sparkles size={10} className="text-figueira" />
                            </label>
                            <textarea name="pedido_oracao" rows={3} placeholder="Como podemos orar por ti hoje? (Opcional)" className="w-full bg-bg border border-soft rounded-2xl p-4 text-sm font-bold text-fg focus:border-figueira outline-none shadow-sm transition-all resize-none"></textarea>
                        </div>

                        <button disabled={loading} className="w-full flex items-center justify-center gap-2 bg-fg text-bg py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {loading ? 'A enviar...' : 'Enviar e Concluir'}
                        </button>
                    </form>

                    {/* Link de vídeo no final do formulário */}
                    <div className="pt-6 border-t border-soft text-center">
                        <a
                            href="https://youtu.be/rHNERaeiZPs?si=m0kmcrjyUWSshTxw"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-figueira hover:text-fg transition-colors"
                        >
                            <PlayCircle size={14} />
                            Assiste ao vídeo da nossa Igreja
                        </a>
                    </div>
                </div>
            </div>
        </main>
    )
}