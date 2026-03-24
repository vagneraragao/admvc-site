// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 1. Busca a sessão do utilizador
    const session = await getSessionData();

    // 🚨 O SEGURANÇA À PORTA DO PRÉDIO ADMINISTRATIVO 🚨
    // Se não estiver logado OU se a role não for estritamente 'ADMIN', recambia logo!
    if (!session || session.role !== 'ADMIN') {
        // Redireciona o engraçadinho para o dashboard normal dele
        redirect('/membros/dashboard?error=Acesso Restrito a Administradores');
    }

    // Se passou na verificação, o Next.js carrega a página que ele pediu (dashboard, lista de membros, etc)
    return (
        <div className="admin-wrapper">
            {children}
        </div>
    );
}