import Link from 'next/link'
import { Car, Coffee, ShoppingCart, Wallet2 } from 'lucide-react'

export default function AcoesRapidas() {
    const acoes = [
        { label: 'Boleia', href: '/boleia', icon: Car, cor: 'text-figueira' },
        { label: 'Menu', href: '/cantina/menu-local', icon: Coffee, cor: 'text-orange-500' },
        { label: 'Encomendar', href: '/cantina/menu-local', icon: ShoppingCart, cor: 'text-blue-500' },
        { label: 'Saldo', href: '/cantina/carregar', icon: Wallet2, cor: 'text-emerald-500' },
    ]

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {acoes.map(a => (
                <Link key={a.href + a.label} href={a.href}
                    className="shrink-0 flex items-center gap-2 bg-bg2 border border-soft px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted hover:border-figueira/30 hover:text-fg transition-all">
                    <a.icon size={12} className={a.cor} /> {a.label}
                </Link>
            ))}
        </div>
    )
}
