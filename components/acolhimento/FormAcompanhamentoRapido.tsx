'use client'

import { useState, useRef } from 'react'
import { MessageCircle, Send, CheckCircle2, Loader2, History } from 'lucide-react'
import { salvarRelatoRapido } from '@/actions/visitante-actions';
import ModalHistorico from './ModalHistorico'

export default function FormAcompanhamentoRapido({ visitante }: { visitante: any }) {
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await salvarRelatoRapido(formData)
        setLoading(false)

        if (res.ok) {
            setSucesso(true)
            formRef.current?.reset()
            setTimeout(() => setSucesso(false), 3000)
        } else {
            alert(res.error)
        }
    }

    return (
        <div className="space-y-4">
            {/* BOX DE HISTÓRICO ÚNICO E CLEAN */}
            <div className="bg-bg border border-soft p-4 rounded-2xl relative group/hist shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-figueira uppercase tracking-[0.2em]">Último Relato</span>

                    {/* Botão "Ver Tudo" que abre o ModalHistorico */}
                    <ModalHistorico
                        visitante={visitante}
                        acionador={
                            <div className="text-[8px] font-black uppercase text-muted hover:text-figueira flex items-center gap-1 transition-colors cursor-pointer bg-soft/30 px-2 py-1 rounded-md">
                                <History size={10} /> Ver Tudo
                            </div>
                        }
                    />
                </div>

                <p className="text-[10px] font-medium text-fg italic leading-relaxed">
                    "{visitante.acompanhamentos?.[0]?.observacoes || 'Sem histórico registado.'}"
                </p>

                {/* Data discreta no rodapé do box */}
                {visitante.acompanhamentos?.[0] && (
                    <span className="text-[7px] text-muted font-bold uppercase mt-2 block opacity-50">
                        {new Date(visitante.acompanhamentos[0].data_contacto).toLocaleDateString('pt-PT')}
                    </span>
                )}
            </div>

            {/* FORMULÁRIO DE ENVIO */}
            <form ref={formRef} action={handleSubmit} className="space-y-3 pt-2 border-t border-soft relative">
                <input type="hidden" name="visitante_id" value={visitante.id} />

                <textarea
                    name="relato"
                    placeholder="Escreve aqui o novo contacto..."
                    required
                    className="w-full bg-bg border border-soft rounded-xl p-3 text-[10px] font-bold text-fg focus:border-figueira outline-none shadow-inner resize-none h-20 transition-all"
                ></textarea>

                <div className="flex gap-2">
                    <a
                        href={`https://wa.me/${visitante.telefone?.replace(/\D/g, '')}`}
                        target="_blank"
                        className="w-12 h-12 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                    >
                        <MessageCircle size={16} />
                    </a>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50
                            ${sucesso ? 'bg-green-500 text-white' : 'bg-figueira text-white hover:brightness-110'}
                        `}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : (sucesso ? <CheckCircle2 size={14} /> : <Send size={14} />)}
                        {loading ? 'A Gravar...' : (sucesso ? 'Gravado!' : 'Gravar Relato')}
                    </button>
                </div>

                {/* Mensagem de Sucesso Flutuante (Opcional, pode remover se achar demais) */}
                {sucesso && (
                    <div className="absolute inset-0 bg-bg2/90 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300 rounded-xl z-10">
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} /> Relato guardado!
                        </p>
                    </div>
                )}
            </form>
        </div>
    )
}