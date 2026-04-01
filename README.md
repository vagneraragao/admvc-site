# ADMVC - Plataforma de Gestao Integrada para Igrejas

> **"Se muito bem-vindo, fica para sempre!"** — Plataforma Fullstack multi-tenant para gestao completa de igrejas, desenhada para a **ADMVC** e preparada para escalar como SaaS.

---

## Sobre o Projeto

O **ADMVC** e uma plataforma completa de gestao de igrejas que cobre desde o acolhimento de visitantes ate ao controlo financeiro, escalas de servico, louvor e inventario. Cada funcionalidade e um modulo independente que pode ser activado ou desactivado por plano.

### Destaques
- **Multi-tenant:** Multiplas igrejas isoladas na mesma plataforma
- **Sistema de planos:** FREE, BASIC, PRO, ENTERPRISE com modulos configuraveis por igreja
- **Super-Admin separado:** Administracao SaaS completamente independente do portal da igreja
- **Seguranca:** Auth checks em todas as server actions, rate limiting, tenant isolation

---

## Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router, Server Actions) |
| Linguagem | TypeScript |
| Base de Dados | PostgreSQL |
| ORM | Prisma 7.5 |
| Estilizacao | Tailwind CSS + Lucide Icons |
| Auth | Custom cookie-based (bcryptjs, sessoes separadas) |
| Rate Limiting | Upstash Redis (Ratelimit) |
| Email | Resend API |
| Ficheiros | Vercel Blob Storage |
| Integracoes | Loyverse (POS), Holyrics (Projeccao), Spotify/YouTube |

---

## Arquitectura Modular

Cada modulo e uma rota independente que pode ser habilitada/desabilitada pelo sistema de planos:

```
app/
├── escalas/           Modulo: Escalas (admin + gestao + relatorios)
├── grupos/            Modulo: Grupos/Celulas (admin + gestao)
├── louvor/            Modulo: Louvor (holyrics + setlist)
├── inventario/        Modulo: Inventario
├── departamentos/
│   ├── cantina/       Modulo: Cantina (Loyverse)
│   ├── financeiro/    Modulo: Financeiro
│   └── acolhimento/   Modulo: Acolhimento
│
├── admin/             Core: Painel administrativo (sempre disponivel)
│   ├── dashboard/
│   ├── membros/       Cadastro, importacao, edicao, visualizacao
│   ├── familias/
│   ├── congregacoes/
│   ├── configuracoes/
│   ├── auditoria/
│   └── relatorios/
│
├── membros/           Core: Portal do membro (sempre disponivel)
│   ├── dashboard/
│   ├── login/         Login unificado para membros e admin
│   ├── perfil/
│   ├── mural/
│   └── termos/
│
├── super-admin/       SaaS: Gestao da plataforma (auth independente)
│   ├── login/         Login separado (tabela SuperAdmin)
│   ├── dashboard/     Visao geral de todos os tenants
│   ├── igrejas/       Gestao de igrejas
│   └── igrejas/[id]/modulos/  Activar/desactivar modulos por igreja
│
└── api/               Endpoints REST
```

---

## Sistema de Planos

| Plano | Modulos | Membros | Congregacoes |
|---|---|---|---|
| FREE | Mural | 50 | 1 |
| BASIC | Escalas, Grupos, Mural, Acolhimento, Relatorios, Auditoria | 200 | 3 |
| PRO | Todos | Ilimitado | 10 |
| ENTERPRISE | Todos | Ilimitado | Ilimitado |

Cada igreja pode ter overrides personalizados via campo `modulos_custom` (JSONB).

### Verificacao em 3 camadas
1. **Middleware (Edge)** — verifica plano no cookie, bloqueia rotas de modulos desabilitados
2. **Pages (Server)** — `checkModulo()` para mostrar/esconder UI condicionalmente
3. **Actions (Server)** — `requireModulo()` para bloquear operacoes de dados

---

## Seguranca

- **Auth checks** em ~120 server actions via `requireAuth()` / `requireRole()`
- **Rate limiting** no login: 5 tentativas/email + 15 tentativas/IP por 15 min (Upstash Redis)
- **Tenant isolation** via Prisma extensions (queries automaticamente filtradas por tenant_id)
- **Super-Admin isolado** com cookie, tabela e login proprios (nao partilha sessao com membros)
- **Headers de seguranca:** HSTS, X-Frame-Options: DENY, nosniff, strict referrer
- **Error boundaries** no root, /admin e /membros
- **APIs debug** bloqueadas em producao (retornam 404)
- **Audit logging** para login, operacoes financeiras, alteracoes de dados

---

## Configuracao

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variaveis de ambiente
Criar ficheiro `.env` na raiz (ver `.env.example` para referencia):
```
DATABASE_URL="postgresql://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
RESEND_API_KEY="re_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### 3. Base de dados
```bash
npx prisma generate
npx prisma migrate dev
npm run db:fresh          # Seed com dados iniciais
```

### 4. Executar
```bash
npm run dev               # http://localhost:3000
```

### Credenciais padrao (seed)
| Tipo | Email | Password |
|---|---|---|
| Super Admin | sa@admvc.com | superadmin123 |
| Admin Igreja | admin@admvc.com | admin123 |

---

## Identidade Visual

| Elemento | Valor |
|---|---|
| Primary (Figueira) | `#3F6B4F` |
| Secondary (Soft) | `#7FAE93` |
| Titulos | Black Italic Uppercase |
| Componentes | `rounded-[2rem]` |
| Super-Admin | Dark theme (`#0A0A0A`) |

---

## Licenca

Software de propriedade e uso exclusivo da Igreja Assembleia de Deus - Ministerio Visao de Conquista (ADMVC).

Desenvolvido pela equipa de tecnologia ADMVC.
