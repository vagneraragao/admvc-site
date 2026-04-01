// components/ui/BrandingProvider.tsx
// Server component que injecta CSS variables do tenant no portal

import { getTenantBranding, gerarCorDeep, gerarBg2 } from '@/lib/branding'

export default async function BrandingProvider({ children }: { children: React.ReactNode }) {
    const branding = await getTenantBranding()

    const cssVars = {
        '--g-figueira': branding.corPrimaria,
        '--g-deep': gerarCorDeep(branding.corPrimaria),
        '--g-soft': branding.corSecundaria,
        '--bg': branding.corFundo,
        '--bg2': gerarBg2(branding.corFundo),
    } as React.CSSProperties

    return (
        <div style={cssVars} className="contents">
            {children}
        </div>
    )
}
