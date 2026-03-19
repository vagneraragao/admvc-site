// app/membros/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function MembrosPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const handleFakeLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !pass) return;

        setIsLoading(true);

        // Simulando o suspense do sistema
        setTimeout(() => {
            setIsLoading(false);
            setIsLoggedIn(true);
        }, 1200);
    };

    return (
        <main className="max-w-xl mx-auto space-y-8 py-12 px-4">

            {!isLoggedIn ? (
                /* --- FORMULÁRIO DE LOGIN (FACHADA) --- */
                <section className="rounded-3xl border border-soft bg-bg2 p-8 shadow-sm space-y-6">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-figueira/10 rounded-full flex items-center justify-center mb-4 text-figueira">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-fg">Portal do Membro</h1>
                        <p className="text-sm text-muted">Identifique-se para acessar a área restrita.</p>
                    </div>

                    <form onSubmit={handleFakeLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-soft bg-bg px-5 py-3 text-sm outline-none focus:border-figueira transition-all"
                                placeholder="exemplo@admvc.pt"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Palavra-passe</label>
                            <input
                                type="password"
                                required
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                className="w-full rounded-2xl border border-soft bg-bg px-5 py-3 text-sm outline-none focus:border-figueira transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2"
                        >
                            {isLoading ? "A validar credenciais..." : "Entrar no Sistema"}
                        </button>
                    </form>
                </section>
            ) : (
                /* --- A SURPRESA (COM FUNDO INTEGRADO AO TEMA) --- */
                <section className="relative overflow-hidden rounded-3xl border border-figueira/30 bg-bg2 p-10 text-center space-y-8 shadow-sm animate-in zoom-in-95 duration-500">
                    {/* Detalhe visual de luz no fundo */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-figueira/5 rounded-full blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <span className="inline-block px-3 py-1 bg-figueira/10 text-figueira rounded-full text-[10px] font-black uppercase tracking-widest border border-figueira/20">
                            Acesso Autorizado
                        </span>
                        <h2 className="text-3xl font-black text-fg tracking-tight">
                            Paz do Senhor, <span className="text-figueira">querido(a)</span>!
                        </h2>
                    </div>

                    <div className="relative z-10 p-6 bg-bg rounded-2xl border border-soft shadow-inner italic text-muted leading-relaxed">
                        <svg className="absolute -top-3 -left-2 w-8 h-8 text-figueira/10" fill="currentColor" viewBox="0 0 32 32"><path d="M10 8v8H6v2a2 2 0 002 2h2v4H8a6 6 0 01-6-6v-8a2 2 0 012-2h4zm12 0v8h-4v2a2 2 0 002 2h2v4h-2a6 6 0 01-6-6v-8a2 2 0 012-2h4z" /></svg>
                        "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna."
                        <span className="block font-bold text-figueira not-italic mt-2">— João 3:16</span>
                    </div>

                    <div className="relative z-10 space-y-4 max-w-sm mx-auto">
                        <p className="text-sm text-muted">
                            Sabe, mais importante do que acessar qualquer sistema terreno, é saber que o seu nome está escrito no <strong>Livro da Vida</strong>.
                        </p>
                        <p className="text-sm font-medium text-fg">
                            Seja bem-vindo à casa de Deus.
                        </p>
                    </div>

                    <div className="relative z-10 pt-4">
                        <button
                            onClick={() => { setIsLoggedIn(false); setEmail(""); setPass(""); }}
                            className="text-[10px] font-bold text-muted hover:text-figueira uppercase tracking-widest transition-colors"
                        >
                            &larr; Em breve teremos a nossa área de membros
                        </button>
                    </div>
                </section>
            )}

            <div className="text-center pt-4">
                <Link href="/" className="text-xs text-muted hover:text-figueira transition-colors underline underline-offset-4 decoration-soft">
                    Voltar para a página inicial
                </Link>
            </div>
        </main>
    );
}