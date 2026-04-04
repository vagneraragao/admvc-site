# ADMVC Cloud

> **"Se muito bem-vindo, fica para sempre!"** — Plataforma multi-tenant de gestao integrada para igrejas.

## Sobre o Projecto

O **ADMVC Cloud** e uma plataforma SaaS completa para gestao de igrejas que cobre acolhimento de visitantes, gestao de membros, departamentos, escalas de servico, louvor com cifras, educacao (cursos e escola biblica), financas, inventario e comunicacao — tudo num unico portal com acesso baseado em roles.

### Numeros

| | Quantidade |
|---|---|
| Paginas | 71 |
| APIs REST | 18 |
| Server Actions | 22 |
| Componentes React | 167+ |
| Modelos de Dados | 44 |

---

## Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router, Server Actions) |
| Linguagem | TypeScript |
| Base de Dados | PostgreSQL (pool max=2 para serverless) |
| ORM | Prisma 7.5 (adapter pg, extensions multi-tenant) |
| Estilizacao | Tailwind CSS + Lucide Icons |
| Auth | Custom cookie-based (bcryptjs) |
| Cache | Upstash Redis (fail-open) + unstable_cache |
| Rate Limiting | Upstash Redis (@upstash/ratelimit) |
| Email | Resend API |
| Ficheiros | Vercel Blob Storage |
| PDF | @react-pdf/renderer (lazy loaded) |
| Mapas | Leaflet + React-Leaflet (dynamic import) |
| Integracoes | Loyverse (POS), Holyrics (Projeccao), Mesa de Som X32, Lumikit (Iluminacao), Spotify, YouTube |

---

## Arquitectura

```
admvc-site/
├── app/                    # Rotas Next.js (App Router)
│   ├── admin/              # Painel administrativo
│   ├── membros/            # Portal do membro
│   ├── departamentos/      # Acolhimento, Cantina, Financeiro
│   ├── escalas/            # Gestao de escalas
│   ├── ensino/             # Cursos, turmas, EBD
│   ├── grupos/             # Pequenos grupos / celulas
│   ├── louvor/             # Holyrics, setlist, cifras internas
│   ├── pregacao/           # Sermoes e pregacoes
│   ├── inventario/         # Controlo de patrimonio
│   ├── gabinete/           # Agenda pastoral
│   ├── midia/              # Holyrics, Mesa de Som X32, Lumikit
│   ├── super-admin/        # Gestao da plataforma SaaS
│   └── api/                # API routes (REST)
├── actions/                # Server Actions (22 ficheiros)
├── components/             # Componentes React (167+ ficheiros)
├── lib/                    # Utilitarios (auth, cache, redis, branding, cifra, etc.)
├── prisma/                 # Schema e migrations
└── public/                 # Assets estaticos + manifest PWA
```

---

## Multi-Tenant

Cada igreja e um `Tenant` isolado. O `getTenantClient()` em `lib/prisma.ts` filtra automaticamente todas as queries por `tenant_id`. O middleware extrai a sessao do cookie e injeta headers:

- `x-tenant-id` — identificador da igreja
- `x-user-id` — identificador do membro
- `x-user-role` — role do membro
- `x-congregation-id` — congregacao (opcional)

---

## Roles e Permissoes

| Role | Acesso |
|------|--------|
| `USER` | Dashboard, escalas, grupos, mural, educacao |
| `LEADER` | + Gestao de departamentos e escalas do seu depto |
| `FINANCE` | + Tesouraria e relatorios financeiros |
| `CONGREGATION_ADMIN` | + Admin da sua congregacao |
| `ADMIN` | + Acesso total ao painel admin |
| `SuperAdmin` | Gestao da plataforma SaaS (auth separada) |

---

## Sistema de Planos

| Plano | Modulos | Membros | Congregacoes |
|---|---|---|---|
| FREE | Mural | 50 | 1 |
| BASIC | + Escalas, Grupos, Acolhimento, Relatorios | 200 | 3 |
| PRO | + Financeiro, Cantina, Inventario | Ilimitado | 10 |
| ENTERPRISE | + Louvor, Personalizacao, Gabinete, Educacao | Ilimitado | Ilimitado |

Verificacao em 3 camadas: Middleware (Edge) → Pages (Server) → Actions (Server).

---

## Performance e Cache

O site utiliza uma stack de cache em 3 camadas:

| Camada | Tecnologia | Descricao |
|---|---|---|
| CDN | Vercel Edge | Servir assets estaticos |
| Redis | Upstash (free tier) | Cache aplicacional com TTL (membros 60s, departamentos 120s, etc.) |
| PostgreSQL | Supabase | Source of truth (fallback se Redis falhar) |

**Fail-open**: Se o Redis estiver indisponivel, as queries vao directo ao DB sem erro.

**Invalidacao automatica**: Ao criar/atualizar/importar membros, departamentos, grupos, sermoes ou config do tenant, o cache Redis e invalidado.

**Otimizacoes**:
- Connection pool `max: 2` + `idleTimeoutMillis: 20000` (serverless-friendly)
- `select` em vez de `include: true` nas queries mais pesadas
- `Image` com `sizes` para evitar download de imagens maiores que o necessario
- `React.lazy()` para `@react-pdf/renderer`, `next/dynamic` para `leaflet`

---

## Congregacoes

Uma igreja pode ter varias congregacoes (sedes). Departamentos e eventos pertencem a uma congregacao ou sao globais. Um musico pode servir em departamentos de varias congregacoes, mas as escalas ficam separadas por evento+departamento.

---

## Seguranca

- Auth checks em ~120 server actions (`requireAuth()` / `requireRole()`)
- Rate limiting no login (5/email + 15/IP por 15 min)
- Tenant isolation via Prisma extensions
- Super-Admin isolado (cookie, tabela e login proprios)
- Headers: HSTS, X-Frame-Options: DENY, nosniff
- CORS restringido em producao
- Error boundaries no root, /admin e /membros
- Try/catch nos layouts criticos (admin, membro) com degradacao graceful
- Audit logging

---

## Personalizacao Visual

Cada igreja pode personalizar cores (primaria, secundaria, fundo) e logotipo. O sistema gera automaticamente cores derivadas (borders, texto, muted) e suporta fundos claros e escuros. Preview em tempo real com mini-dashboard.

---

## PWA (Progressive Web App)

A aplicacao esta configurada como PWA. Para instalar no telemovel:
- **Android**: Chrome > Menu > "Adicionar ao ecra inicial"
- **iPhone**: Safari > Partilhar > "Adicionar ao ecra inicial"

Funcionalidades: ecra completo sem barra do browser, cache offline, Wake Lock no modo palco.

---

## Configuracao

```bash
# 1. Copiar variaveis de ambiente
cp .env.example .env

# 2. Instalar dependencias
npm install

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Criar/migrar base de dados
npx prisma migrate dev

# 5. Popular com dados iniciais
npm run db:fresh

# 6. Iniciar em desenvolvimento
npm run dev
```

### Credenciais de Teste (seed)

| Tipo | Email | Password |
|------|-------|----------|
| Super Admin | sa@admvc.com | superadmin123 |
| Admin Igreja | admin@admvc.com | admin123 |

---

## Deploys

| Ambiente | URL | Branch |
|----------|-----|--------|
| Producao | app.igrejaadmvc.org | main |
| Dev | dev.igrejaadmvc.org | teste-seguranca |
| Site Publico | www.igrejaadmvc.org | admvc-website (repo separado) |

---

## Documentacao Detalhada

Consultar [DETAIL.md](./DETAIL.md) para a descricao completa de cada modulo, funcao e componente.

---

## Licenca

Software de propriedade e uso exclusivo da Igreja Assembleia de Deus — Ministerio Visao de Conquista (ADMVC).
