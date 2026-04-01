'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SA_COOKIE = 'admvc_sa_session'

export async function loginSuperAdmin(formData: FormData) {
    const email = (formData.get('email') as string)?.toLowerCase().trim()
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Preencha todos os campos.' }
    }

    const sa = await prisma.superAdmin.findUnique({ where: { email } })

    if (!sa || !sa.is_active) {
        return { error: 'Credenciais invalidas.' }
    }

    const senhaValida = await bcrypt.compare(password, sa.password)
    if (!senhaValida) {
        return { error: 'Credenciais invalidas.' }
    }

    const sessionData = `sa_id:${sa.id}|email:${sa.email}`
    const cookieStore = await cookies()
    cookieStore.set(SA_COOKIE, sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 horas
        sameSite: 'lax',
    })

    redirect('/super-admin/dashboard')
}

export async function logoutSuperAdmin() {
    const cookieStore = await cookies()
    cookieStore.delete(SA_COOKIE)
    redirect('/super-admin/login')
}
