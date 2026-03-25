'use server'

import prisma from '@/lib/prisma'
import { cookies, headers } from 'next/headers' // ✅ Importação do headers corrigida
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ============================================================================
// 🛡️ CONFIGURAÇÃO DO RATE LIMITER (Proteção contra Força Bruta)
// ============================================================================
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN!,
});

const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 tentativas em 15 minutos
    analytics: true,
});

// 🛠️ FUNÇÃO AJUDANTE: Reutiliza a proteção em todos os logins
async function verificarRateLimit() {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";

    const { success, reset } = await ratelimit.limit(`ratelimit_login_${ip}`);

    if (!success) {
        const minutosRestantes = Math.ceil((reset - Date.now()) / 1000 / 60);
        console.log(`🚨 ALERTA: IP ${ip} bloqueado temporariamente por força bruta!`);
        return {
            permitido: false,
            erro: `Muitas tentativas falhadas. Por segurança, aguarde ${minutosRestantes} minutos antes de tentar novamente.`
        };
    }
    return { permitido: true, ip };
}

// ============================================================================
// 1. AÇÕES DE LOGIN COM FORM DATA (Direto dos Formulários)
// ============================================================================

/**
 * LOGIN UNIFICADO: O sistema decide para onde enviar com base na Role
 */
export async function loginUnificado(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log(`\n=============================================`);
    console.log(`🌍 [LOGIN UNIFICADO] Tentativa de acesso: ${email}`);

    // 🛡️ VERIFICAR RATE LIMIT ANTES DA BASE DE DADOS
    const rateLimit = await verificarRateLimit();
    if (!rateLimit.permitido) return { error: rateLimit.erro };

    const usuario = await prisma.membro.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!usuario || !usuario.password) {
        console.log(`❌ ERRO: Utilizador não encontrado ou sem senha.`);
        return { error: "Credenciais inválidas." };
    }

    if (usuario.is_active === false) {
        console.log(`❌ ERRO: Conta inativa (is_active = false).`);
        return { error: "Esta conta está suspensa. Contacte a administração." };
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
        console.log(`❌ ERRO: Senha incorreta.`);
        return { error: "Credenciais inválidas." };
    }

    console.log(`🎉 LOGIN BEM SUCEDIDO! Role: ${usuario.role}`);

    const sessionData = `id:${usuario.id}|role:${usuario.role}`;
    const cookieStore = await cookies();

    cookieStore.set('admvc_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias de sessão
        sameSite: 'lax',
    });

    console.log(`=============================================\n`);

    // Redirecionamento Inteligente
    if (usuario.role === 'ADMIN') redirect('/admin/dashboard');
    if (usuario.role === 'FINANCE') redirect('/departamentos/financeiro/dashboard');
    redirect('/membros/dashboard'); // USER ou LEADER
}

/**
 * LOGIN EXCLUSIVO PARA ADMIN (Página de login de Administradores)
 */
export async function loginAdmin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log(`\n=============================================`);
    console.log(`🛡️ [LOGIN ADMIN] Tentativa de acesso: ${email}`);

    // 🛡️ VERIFICAR RATE LIMIT ANTES DA BASE DE DADOS
    const rateLimit = await verificarRateLimit();
    if (!rateLimit.permitido) return { error: rateLimit.erro };

    const membro = await prisma.membro.findFirst({
        where: { email: email.toLowerCase().trim(), role: 'ADMIN' }
    });

    if (!membro || !membro.password) {
        console.log(`❌ ERRO: Admin não encontrado ou utilizador não tem Role ADMIN.`);
        return { error: "Acesso negado ou credenciais inválidas." };
    }

    if (membro.is_active === false) {
        console.log(`❌ ERRO: Admin inativo.`);
        return { error: "Conta de administrador desativada." };
    }

    const senhaValida = await bcrypt.compare(password, membro.password);
    if (!senhaValida) {
        console.log(`❌ ERRO: Senha incorreta.`);
        return { error: "Acesso negado ou credenciais inválidas." };
    }

    const sessionData = `id:${membro.id}|role:${membro.role}`;
    const cookieStore = await cookies();

    cookieStore.set('admvc_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 dia
        path: '/',
        sameSite: 'lax',
    });

    console.log(`🎉 LOGIN ADMIN BEM SUCEDIDO!`);
    console.log(`=============================================\n`);

    redirect('/admin/dashboard');
}

// ============================================================================
// 2. AÇÕES DE LOGIN VIA PARÂMETROS (Componentes Client / API)
// ============================================================================

/**
 * VALIDAÇÃO GERAL COM REDIRECIONAMENTO CUSTOMIZADO
 */
export async function validarLoginGeral(email: string, pass: string, redirectPath: string = '/membros/dashboard') {
    console.log(`\n=============================================`);
    console.log(`🚪 [LOGIN GERAL CUSTOMIZADO] Tentativa: ${email}`);

    // 🛡️ VERIFICAR RATE LIMIT ANTES DA BASE DE DADOS
    const rateLimit = await verificarRateLimit();
    if (!rateLimit.permitido) return { autorizado: false, erro: rateLimit.erro };

    let logado = false;
    let userRole = 'USER';

    try {
        const membro = await prisma.membro.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (!membro || !membro.password) {
            return { autorizado: false, erro: "Credenciais inválidas." };
        }

        if (membro.is_active === false) {
            return { autorizado: false, erro: "A sua conta encontra-se inativa." };
        }

        const senhaValida = await bcrypt.compare(pass, membro.password);
        if (!senhaValida) {
            return { autorizado: false, erro: "Credenciais inválidas." };
        }

        if (redirectPath.includes('/admin') && membro.role !== 'ADMIN') {
            return { autorizado: false, erro: "Não tem permissão de administrador." };
        }

        const cookieStore = await cookies();
        cookieStore.set('admvc_session', `id:${membro.id}|role:${membro.role}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 2, // 2 horas
            path: '/',
            sameSite: 'lax',
        });

        logado = true;
        userRole = membro.role;
        revalidatePath('/', 'layout');

    } catch (error) {
        console.error("❌ ERRO GRAVE NO LOGIN:", error);
        return { autorizado: false, erro: "Erro de conexão com o servidor." };
    }

    if (logado) {
        const target = userRole === 'ADMIN' && redirectPath.includes('/admin')
            ? '/admin/dashboard'
            : '/membros/dashboard';
        redirect(target);
    }
}

/**
 * VALIDAÇÃO SIMPLES DE MEMBRO (Devolve os dados, sem criar cookie)
 */
export async function validarLoginMembro(email: string, pass: string) {
    // 🛡️ VERIFICAR RATE LIMIT ANTES DA BASE DE DADOS
    const rateLimit = await verificarRateLimit();
    if (!rateLimit.permitido) return { autorizado: false, erro: rateLimit.erro };

    try {
        const membro = await prisma.membro.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: { familia: true }
        });

        if (!membro || !membro.password || membro.is_active === false) {
            return { autorizado: false };
        }

        const senhaValida = await bcrypt.compare(pass, membro.password);
        if (!senhaValida) return { autorizado: false };

        return { autorizado: true, membro };
    } catch (error) {
        return { autorizado: false, erro: "Falha na conexão." };
    }
}

// ============================================================================
// 3. AÇÕES DE LOGOUT
// ============================================================================

export async function logoutGeral(tipo: 'admin' | 'membro') {
    const cookieStore = await cookies();
    cookieStore.delete('admvc_session');
    revalidatePath('/', 'layout');

    if (tipo === 'admin') {
        redirect('/admin/login');
    } else {
        redirect('/membros/login');
    }
}

// Aliases para facilitar o uso nos componentes
export async function logoutAdmin() { return logoutGeral('admin'); }
export async function logoutMembro() { return logoutGeral('membro'); }