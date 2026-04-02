'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, Loader2, Lightbulb, Sun, CheckCircle2 } from 'lucide-react'
import { salvarLumikitCenas, type LumikitScene, type LumikitDimmer, type LumikitConfig } from '@/actions/midia-actions'

const CORES_DISPONIVEIS = [
    { id: 'blue', nome: 'Azul', classe: 'bg-blue-500' },
    { id: 'purple', nome: 'Roxo', classe: 'bg-purple-500' },
    { id: 'amber', nome: 'Amarelo', classe: 'bg-amber-500' },
    { id: 'indigo', nome: 'Indigo', classe: 'bg-indigo-500' },
    { id: 'emerald', nome: 'Verde', classe: 'bg-emerald-500' },
    { id: 'red', nome: 'Vermelho', classe: 'bg-red-500' },
    { id: 'pink', nome: 'Rosa', classe: 'bg-pink-500' },
    { id: 'cyan', nome: 'Ciano', classe: 'bg-cyan-500' },
]

const SCENE_LETTERS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M']

interface Props {
    initialConfig: LumikitConfig
}

export default function LumikitCenasEditor({ initialConfig }: Props) {
    const [scenes, setScenes] = useState<LumikitScene[]>(initialConfig.scenes)
    const [dimmers, setDimmers] = useState<LumikitDimmer[]>(initialConfig.dimmers)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    // ── SCENES CRUD ──
    const addScene = () => {
        setScenes(prev => [...prev, {
            id: crypto.randomUUID(),
            nome: '',
            cor: 'blue',
            page: 0,
            scene: 0,
        }])
    }

    const updateScene = (id: string, field: keyof LumikitScene, value: any) => {
        setScenes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const removeScene = (id: string) => {
        setScenes(prev => prev.filter(s => s.id !== id))
    }

    // ── DIMMERS CRUD ──
    const addDimmer = () => {
        setDimmers(prev => [...prev, {
            id: crypto.randomUUID(),
            nome: '',
            page: 0,
            scene: 0,
        }])
    }

    const updateDimmer = (id: string, field: keyof LumikitDimmer, value: any) => {
        setDimmers(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
    }

    const removeDimmer = (id: string) => {
        setDimmers(prev => prev.filter(d => d.id !== id))
    }

    // ── SAVE ──
    const handleSave = async () => {
        setSaving(true)
        setMsg('')
        const res = await salvarLumikitCenas({ scenes, dimmers })
        setSaving(false)
        setMsg(res.ok ? 'Cenas e dimmers guardados!' : (res.error || 'Erro'))
        setTimeout(() => setMsg(''), 4000)
    }

    return (
        <div className="space-y-6">
            {msg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${msg.includes('guardados') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <CheckCircle2 size={14} /> {msg}
                </div>
            )}

            {/* CENAS */}
            <div className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
                    <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-fg">Botoes de Cena</h3>
                        <span className="text-[8px] font-bold bg-soft px-2 py-0.5 rounded text-muted">{scenes.length}</span>
                    </div>
                    <button onClick={addScene} type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-figueira text-white text-[8px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all">
                        <Plus size={12} /> Adicionar
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {scenes.length === 0 && (
                        <p className="text-[10px] text-muted text-center py-4 font-bold uppercase tracking-widest">
                            Nenhuma cena configurada. Clique em "Adicionar" para criar botoes.
                        </p>
                    )}

                    {scenes.map((scene) => (
                        <div key={scene.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-bg border border-soft rounded-xl">
                            {/* Nome */}
                            <div className="flex-1 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Nome do botao</label>
                                <input type="text" value={scene.nome} onChange={e => updateScene(scene.id, 'nome', e.target.value)}
                                    placeholder="Ex: Oracao, Louvor..."
                                    className="w-full bg-bg2 border border-soft rounded-lg px-3 py-2 text-sm font-bold text-fg focus:border-figueira outline-none placeholder:text-muted/30" />
                            </div>

                            {/* Cor */}
                            <div className="space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Cor</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {CORES_DISPONIVEIS.map(c => (
                                        <button key={c.id} type="button" onClick={() => updateScene(scene.id, 'cor', c.id)}
                                            className={`w-6 h-6 rounded-lg ${c.classe} transition-all ${scene.cor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-bg scale-110' : 'opacity-50 hover:opacity-100'}`}
                                            title={c.nome} />
                                    ))}
                                </div>
                            </div>

                            {/* Page */}
                            <div className="w-20 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Page</label>
                                <select value={scene.page} onChange={e => updateScene(scene.id, 'page', Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-lg px-2 py-2 text-sm font-bold text-fg focus:border-figueira outline-none">
                                    {Array.from({ length: 100 }, (_, i) => (
                                        <option key={i} value={i}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cena (letra) */}
                            <div className="w-20 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Cena</label>
                                <select value={scene.scene} onChange={e => updateScene(scene.id, 'scene', Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-lg px-2 py-2 text-sm font-bold text-fg focus:border-figueira outline-none">
                                    {SCENE_LETTERS.map((letra, i) => (
                                        <option key={i} value={i}>{letra}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Apagar */}
                            <div className="flex items-end">
                                <button type="button" onClick={() => removeScene(scene.id)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DIMMERS */}
            <div className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
                    <div className="flex items-center gap-2">
                        <Sun size={16} className="text-amber-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-fg">Dimmers (Faders)</h3>
                        <span className="text-[8px] font-bold bg-soft px-2 py-0.5 rounded text-muted">{dimmers.length}</span>
                    </div>
                    <button onClick={addDimmer} type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-figueira text-white text-[8px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all">
                        <Plus size={12} /> Adicionar
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {dimmers.length === 0 && (
                        <p className="text-[10px] text-muted text-center py-4 font-bold uppercase tracking-widest">
                            Nenhum dimmer configurado. Use para controlar brilho de grupos de equipamentos.
                        </p>
                    )}

                    {dimmers.map((dimmer) => (
                        <div key={dimmer.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-bg border border-soft rounded-xl">
                            {/* Nome */}
                            <div className="flex-1 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Nome do grupo</label>
                                <input type="text" value={dimmer.nome} onChange={e => updateDimmer(dimmer.id, 'nome', e.target.value)}
                                    placeholder="Ex: Palco, Plateia, Altar..."
                                    className="w-full bg-bg2 border border-soft rounded-lg px-3 py-2 text-sm font-bold text-fg focus:border-figueira outline-none placeholder:text-muted/30" />
                            </div>

                            {/* Page */}
                            <div className="w-20 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Page</label>
                                <select value={dimmer.page} onChange={e => updateDimmer(dimmer.id, 'page', Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-lg px-2 py-2 text-sm font-bold text-fg focus:border-figueira outline-none">
                                    {Array.from({ length: 100 }, (_, i) => (
                                        <option key={i} value={i}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cena (letra) */}
                            <div className="w-20 space-y-1">
                                <label className="text-[7px] font-black uppercase tracking-widest text-muted">Cena</label>
                                <select value={dimmer.scene} onChange={e => updateDimmer(dimmer.id, 'scene', Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-lg px-2 py-2 text-sm font-bold text-fg focus:border-figueira outline-none">
                                    {SCENE_LETTERS.map((letra, i) => (
                                        <option key={i} value={i}>{letra}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Apagar */}
                            <div className="flex items-end">
                                <button type="button" onClick={() => removeDimmer(dimmer.id)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* INFO API */}
            <div className="bg-bg2 border border-soft rounded-2xl p-4 text-[9px] text-muted/60 space-y-1">
                <p className="font-black uppercase tracking-widest text-muted text-[8px]">Referencia Lumikit SHOW:</p>
                <p><strong>Page:</strong> Corresponde a pagina no Lumikit (1-100).</p>
                <p><strong>Cena:</strong> Letras do teclado — A, S, D, F, G, H, J, K, L, Z, X, C, V, B, N, M (16 cenas por pagina).</p>
                <p><strong>Dimmers:</strong> Usam modo Playback para controlar faders por cena (0-100%).</p>
                <p><strong>API:</strong> Porta 5000 — Activar em Lumikit &gt; Opcoes &gt; Aceitar conexoes remotas.</p>
            </div>

            {/* GUARDAR */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-fg text-bg text-[9px] font-black uppercase tracking-widest hover:bg-figueira transition-all disabled:opacity-50 shadow-sm">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Guardar Cenas e Dimmers
                </button>
            </div>
        </div>
    )
}
