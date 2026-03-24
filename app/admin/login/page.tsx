// app/admin/login/page.tsx
import { redirect } from 'next/navigation'

export default function RedirectAdminLogin() {
    // Sempre que alguém tentar entrar aqui, é mandado para o Login Único
    redirect('/membros/login');

    return null; // O componente não renderiza nada
}