// components/ConfigForm.tsx
"use client"

import { useRef, useTransition } from "react"

interface ConfigFormProps {
    action: (fd: FormData) => Promise<any>;
    placeholder: string;
    label: string;
    buttonColor?: string;
}

export default function ConfigForm({ action, placeholder, label, buttonColor = "bg-fg" }: ConfigFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition(); // Para feedback de carregamento

    async function handleAction(fd: FormData) {
        startTransition(async () => {
            try {
                await action(fd);
                alert(`${label} cadastrado com sucesso!`);
                formRef.current?.reset();
            } catch (error) {
                alert("Erro ao cadastrar. Tente novamente.");
            }
        });
    }

    return (
        <form ref={formRef} action={handleAction} className="flex gap-2">
            <input
                name="nome"
                placeholder={placeholder}
                className="flex-1 bg-bg border border-soft rounded-xl p-3 text-sm outline-none focus:border-figueira transition-all"
                required
                disabled={isPending}
            />
            <button
                type="submit"
                disabled={isPending}
                className={`${buttonColor} text-white px-6 rounded-xl font-bold text-xs uppercase hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50`}
            >
                {isPending ? "..." : "+"}
            </button>
        </form>
    );
}