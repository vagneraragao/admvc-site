'use client'

import { useState, useCallback, createContext, useContext, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ConfirmOptions {
    titulo?: string
    mensagem: string
    botaoConfirmar?: string
    botaoCancelar?: string
    tipo?: 'perigo' | 'aviso' | 'info'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
    const fn = useContext(ConfirmContext)
    if (!fn) throw new Error('useConfirm deve ser usado dentro de <ConfirmProvider>')
    return fn
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({ ...options, resolve })
        })
    }, [])

    const handleClose = (result: boolean) => {
        state?.resolve(result)
        setState(null)
    }

    const cores = {
        perigo: { icon: 'bg-red-500/10 text-red-500', btn: 'bg-red-500 hover:bg-red-600' },
        aviso: { icon: 'bg-orange-500/10 text-orange-500', btn: 'bg-orange-500 hover:bg-orange-600' },
        info: { icon: 'bg-figueira/10 text-figueira', btn: 'bg-figueira hover:brightness-110' },
    }

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && createPortal(
                <div
                    className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    style={{ zIndex: 99999 }}
                    onClick={() => handleClose(false)}
                >
                    <div
                        className="bg-bg w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] border border-soft shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-soft">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cores[state.tipo || 'perigo'].icon}`}>
                                    <AlertTriangle size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">
                                    {state.titulo || 'Confirmação'}
                                </h3>
                            </div>
                            <button
                                onClick={() => handleClose(false)}
                                className="w-8 h-8 flex items-center justify-center bg-soft text-muted hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <p className="text-[12px] text-muted font-medium leading-relaxed">
                                {state.mensagem}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleClose(false)}
                                    className="py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-bg2 border border-soft text-muted hover:bg-soft transition-all"
                                >
                                    {state.botaoCancelar || 'Cancelar'}
                                </button>
                                <button
                                    onClick={() => handleClose(true)}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md ${cores[state.tipo || 'perigo'].btn}`}
                                >
                                    {state.botaoConfirmar || 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </ConfirmContext.Provider>
    )
}
