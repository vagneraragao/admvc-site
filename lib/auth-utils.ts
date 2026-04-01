import { cookies } from 'next/headers'

/**
 * Interface representing the session data structure.
 */
export interface SessionData {
    membroId: number;
    role: string;
    email?: string;
}

export type Role = 'ADMIN' | 'LEADER' | 'USER' | 'FINANCE' | 'MANAGER'

/**
 * Requires an authenticated session. Throws if not authenticated.
 * Use in any server action that needs a logged-in user.
 */
export async function requireAuth(): Promise<SessionData> {
    const session = await getSessionData()
    if (!session) throw new Error('Não autenticado. Faça login para continuar.')
    return session
}

/**
 * Requires an authenticated session with one of the specified roles.
 * Throws if not authenticated or role is not allowed.
 */
export async function requireRole(rolesPermitidos: Role[]): Promise<SessionData> {
    const session = await requireAuth()
    if (!rolesPermitidos.includes(session.role as Role)) {
        throw new Error('Sem permissão para esta ação.')
    }
    return session
}

/**
 * Retrieves and parses session data from the 'admvc_session' cookie.
 * 
 * Supports multiple session formats:
 * - Newest: id:XX|email:XX|role:XX
 * - Simplified: id:XX|role:XX
 * - Legacy: membro_XX
 */
export async function getSessionData(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('admvc_session');
    
    if (!session || !session.value) {
        return null;
    }

    const value = session.value;
    let membroId: number | null = null;
    let role: string | null = null;
    let email: string | null = null;

    // Check for the delimited format (id:XX|role:XX|...)
    if (value.includes('id:') && (value.includes('role:') || value.includes('email:'))) {
        const partes = value.split('|');
        partes.forEach(p => {
            if (p.startsWith('id:')) {
                const val = p.split(':')[1];
                if (val) membroId = parseInt(val);
            }
            if (p.startsWith('role:')) {
                const val = p.split(':')[1];
                if (val) role = val.toUpperCase();
            }
            if (p.startsWith('email:')) {
                const val = p.split(':')[1];
                if (val) email = val;
            }
        });
    } 
    // Check for the legacy format (membro_XX)
    else if (value.startsWith('membro_')) {
        membroId = parseInt(value.replace('membro_', ''));
        role = 'USER';
    }

    // Fallback/validation: if we have an ID but no role, assume USER
    if (membroId !== null && !role) {
        role = 'USER';
    }

    if (membroId === null || isNaN(membroId)) {
        return null;
    }

    return { 
        membroId, 
        role: role || 'USER', 
        email: email || undefined 
    };
}
