# ADMVC Cloud — Documentacao Detalhada

Descricao completa de cada modulo, funcionalidade e componente da plataforma.

---

## 1. AUTENTICACAO E SESSAO

### Login (`/membros/login`)
- Formulario de email + password
- Hash com bcryptjs, sessao via cookie `admvc_session`
- Cookie contem: `id`, `role`, `tenant_id`, `plano`, `cong` (congregacao)
- Rate limiting: 5 tentativas por email, 15 por IP a cada 15 minutos (Upstash Redis)
- Apos login, redireciona por role: ADMIN → `/admin/dashboard`, outros → `/membros/dashboard`

### Super-Admin (`/super-admin/login`)
- Tabela `SuperAdmin` separada (sem tenant_id)
- Cookie proprio `admvc_sa_session`
- Acesso a gestao de todas as igrejas e modulos

### Middleware (`middleware.ts`)
- Extrai dados do cookie e injeta headers para server components
- Protege rotas por role (ADMIN para `/admin/*`)
- Verifica modulos do plano e bloqueia rotas nao incluidas

---

## 2. PAINEL DO MEMBRO (`/membros/dashboard`)

### Estrutura
- **Header**: foto, nome, badge de role, nome da igreja + congregacao
- **Menu Servico** (hamburger): Editar Perfil, Indisponibilidade, Relatorio de Escalas, Financas e Cantina, + atalhos de departamentos para lideres
- **Notificacoes** (bell): alertas de acolhimento (visitantes novos) e avisos do mural, auto-refresh a cada 30 segundos
- **Tabs**: Home, Igreja, Financas

### Tab Home
- **Minhas Escalas**: cards dos proximos eventos onde o membro esta escalado, ordenados por confirmados primeiro e data mais proxima. Botoes de confirmar/recusar com motivo.
- **Setlist Palco**: botao de acesso ao modo palco (fullscreen) para musicos do louvor
- **Agenda da Igreja**: proximos eventos, colapsavel no mobile
- **Aniversariantes do Mes**: lista com dia, colapsavel no mobile

### Tab Igreja
- **Departamentos**: cards dos departamentos onde o membro serve, com funcoes e botao de gestao de equipa
- **Grupos**: cards dos PGs/celulas com detalhes (dia, horario, local) e modal de gestao

### Tab Financas (acessivel via menu)
- **Contribuicoes**: objectivos financeiros e historico
- **Cantina**: saldo Loyverse, carregamentos e extrato

---

## 3. PAINEL ADMINISTRATIVO (`/admin/*`)

### Sidebar
- Menu lateral collapsible com navegacao por seccoes
- Logo da igreja (se configurado) no topo
- Filtro de congregacao (dropdown) para admins com multiplas sedes
- Menu mobile com hamburger + drawer animado
- CONGREGATION_ADMIN ve apenas a sua congregacao (dropdown bloqueado)

### Dashboard (`/admin/dashboard`)
- KPIs: membros activos, familias, batizados, escalas pendentes, aprovacoes
- Proximos eventos com contagem de escalados
- Aniversariantes do mes
- Alerta de documentos pendentes (GDPR/Permanecer) com botao de renovacao

### Gestao de Membros (`/admin/membros`)
- Lista com filtros: status, role, cidade, genero, compliance, familia
- Ordenacao por qualquer coluna (nome, email, cidade, etc.)
- Vista tabela ou cards
- Pesquisa por nome, email, telefone, cidade, cargo
- Paginacao configuravel (10, 25, 50, 100, todos)
- **Imprimir**: cartoes de membro (PDF credit-card) e lista completa (PDF A4)

### Cadastrar Membro (`/admin/membros/cadastro`)
- Formulario em 4 passos: Dados Pessoais, Morada, Eclesiastico, Familia e Legal
- Codigo postal portugues com auto-preenchimento (API geoapi.pt)
- Upload de foto (Vercel Blob)
- Validacao de email unico

### Visualizar Membro (`/admin/membros/visualizar/[id]`)
- 5 abas: Perfil, Morada, Familia, Eclesiastico, Servico
- Campos: phone_2, data_admissao, aprovado_por, congregacao, parentesco
- Status documental (GDPR e Permanecer) com validade

### Familias (`/admin/familias`)
- Agrupamento de membros por familia
- Pesquisa por nome de familia ou membro
- Criar nova familia e vincular membros

### Congregacoes (`/admin/congregacoes`)
- Criar/editar congregacoes (nome, cidade, endereco)
- Associar membros a congregacoes (individual ou em massa)

---

## 4. ESTRUTURA DA IGREJA (`/admin/configuracoes`)

### Departamentos
- Criar departamento com congregacao (local ou global)
- Mesmo nome permitido em congregacoes diferentes (ex: "Louvor Leiria" e "Louvor Barcelos")
- **Painel de gestao** (modal com 3 abas):
  - **Equipa**: vincular membros com multiplas funcoes, pesquisa, delegacao de escalas
  - **Cargos**: criar/remover funcoes do departamento
  - **Definicoes**: nome, lider, congregacao, notas

### Cargos Eclesiasticos
- Cargos globais (Diacono, Pastor, Evangelista, etc.)
- Criar e excluir na pagina de estrutura

### Grupos / PGs
- Gestao de pequenos grupos com dia, horario, local
- Geocodificacao automatica (OpenStreetMap)
- Mapa de grupos com Leaflet
- Publicacao no site publico (flag publico)

---

## 5. ESCALAS DE SERVICO

### Admin Escalas (`/admin/escalas`)
- **Montador de escalas**: 5 passos inline (Departamento → Evento → Funcao → Membro → Horario)
- Eventos filtrados pela congregacao do departamento seleccionado
- Verificacao de indisponibilidade do membro antes de escalar
- **Calendario**: visao mensal com eventos e escalas
- **Quadro geral**: lista de escalados por evento com accoes (editar, eliminar)

### Gestao do Lider (`/escalas/gestao/[id]`)
- Mesmo montador mas pre-filtrado pelo departamento do lider
- Eventos filtrados pela congregacao do departamento
- Estatisticas: voluntarios aptos, cargos criados, proximo evento

### Criar Evento
- Modal com 2 modos: evento unico (data) ou culto regular (dia da semana + frequencia + duracao)
- Seleccao de congregacao

### Notificacoes por Email
- Quando membro confirma/recusa escala, o lider do departamento recebe email via Resend
- Template HTML dark com detalhes (nome, evento, data, funcao, motivo de recusa)

### Relatorio de Escalas (`/admin/relatorios/escalas`)
- Ranking de membros por participacao
- KPIs: voluntarios, total escalas, confirmadas, recusadas, taxa de confirmacao
- Filtro por mes e departamento
- Breakdown de funcoes por membro

---

## 6. LOUVOR E CIFRAS

### Holyrics (`/louvor/holyrics`)
- Integracao com o software de projeccao Holyrics
- Sincronizacao de acervo musical

### Setlist / Modo Palco (`/louvor/setlist/[eventoId]`)
- Ecra fullscreen preto optimizado para palco
- Navegacao por swipe (mobile) e setas (desktop)
- Tom e BPM em destaque por musica
- Botoes de recursos: Letra, Cifra, Audio, Video (links externos)
- **Marcar como cantada** com contador
- **Wake Lock**: ecra nao apaga enquanto o musico esta no palco
- Drawer com lista completa e progresso

### Cifras Internas
- **Editor fullscreen**: escrever cifra com acordes entre `[colchetes]`
- **Importar do CifraClub**: colar texto copiado, converte automaticamente
  - Parser reconhece: tags `[Intro]`, `[Refrao]`, parenteses `( Cm Cm7(9) )`, acordes complexos (`Ab7M`, `Bb/Ab`, `Dsus4`, `Cm7(9)`)
  - Remove linhas `Tom:`, `Capo:`
- **Importar automatico via URL**: botao que busca a pagina do CifraClub server-side, extrai a cifra do HTML e guarda na BD (1 clique)
- **Visualizador** com 2 modos:
  - **Inline**: `[Am]Quando eu chorei`
  - **Separado**: acordes numa linha, letra na outra (estilo CifraClub)
- **Transposicao**: botoes +/- mudam todos os acordes (Am → Bm → Cm...)
- **Auto-scroll**: velocidade ajustavel (0.3x a 5x), slider grande para palco, pausa ao tocar na tela com o dedo e retoma ao tirar
- **Tamanho de fonte**: ajustavel (A- / A+)

---

## 7. ACOLHIMENTO DE VISITANTES

### Dashboard (`/departamentos/acolhimento/dashboard`)
- KPIs: novos, em contacto, atrasados (+24h), consolidados
- **Novos visitantes**: lista com WhatsApp e botao registar
- **Em acompanhamento**: lista com badges (Site/+24h), responsavel, historico
- **Consolidados**: avatares empilhados + modal com lista completa e timeline

### Ciclo de Vida
1. Visitante regista-se (formulario publico ou manual)
2. Status `NOVO` → equipa ve no dashboard e na bell de notificacoes
3. Membro do acolhimento regista contacto (WhatsApp/Chamada/Presencial)
4. Status muda para `EM_CONTACTO`
5. Apos integracao, muda para `CONSOLIDADO`

### Relatorio (`/departamentos/acolhimento/relatorio`)
- 8 KPIs com taxa de consolidacao e crescimento vs mes anterior
- Grafico de barras: visitantes por mes (ultimos 6 meses)
- Lista dos ultimos consolidados

### Notificacoes
- Bell icon no header do membro com badge animado
- Auto-refresh a cada 30 segundos
- Flash laranja pulsante quando chega visitante NOVO

---

## 8. FINANCEIRO

### Dashboard (`/departamentos/financeiro/dashboard`)
- Lancamentos com categorias e responsaveis
- Objectivos financeiros com progresso

### Integracao Loyverse
- Sincronizacao de saldo da cantina via API Loyverse
- Pedidos de recarga de saldo

---

## 9. INVENTARIO (`/admin/inventario`)

- Controlo de patrimonio e equipamentos
- Categorias, estados, garantias
- Movimentos: emprestimo, manutencao, transferencia
- Donos: departamento, grupo ou membro
- Filtro por congregacao

---

## 10. GABINETE PASTORAL (`/gabinete`)

- Agenda pastoral com compromissos
- Categorias: Cafe com Pastor, Discipulado, Reuniao de Lideranca, etc.
- Confirmacao por email (Resend)

---

## 11. COMUNICACAO

### Mural (`/membros/mural`)
- Avisos por departamento ou grupo
- Apenas membros do departamento/grupo veem os avisos

### WhatsApp Templates (`lib/whatsapp-templates.ts`)
- 6 mensagens padrao: boas-vindas, convite grupo, lembrete escala, aniversario, follow-up, permanecer
- Componente `BotaoWhatsApp` com dropdown de templates

---

## 12. PERSONALIZACAO VISUAL (`/admin/personalizacao`)

### Cores
- **Primaria**: botoes, links, destaques
- **Secundaria**: badges, hover, elementos de suporte
- **Fundo**: cor de fundo geral (claro ou escuro)
- Cores derivadas automaticamente: border, texto principal, texto muted
- Deteccao automatica claro/escuro (texto adapta-se ao fundo)
- Suporte a opacidade Tailwind (`bg-figueira/10`, `border-figueira/20`)

### Logotipo
- Upload via Vercel Blob
- Aparece na sidebar admin (desktop e mobile)

### Preview
- Mini-dashboard em tempo real: sidebar, KPIs, cards, botoes
- Actualiza instantaneamente ao mudar cores

---

## 13. SUPER-ADMIN (`/super-admin/*`)

### Gestao de Igrejas
- Criar nova igreja com tenant, admin inicial e congregacao
- Activar/desactivar modulos por igreja
- Override de modulos via `modulos_custom` (JSONB)

---

## 14. RELATORIOS

### Membros (`/admin/relatorios`)
- 11 relatorios: cargos, idade, aniversarios, sexo, estado civil, batismo, evolucao entradas, cidades, bairros, compliance GDPR, permissoes
- Modal expansivel com lista de nomes por categoria
- Link para relatorio de escalas por membro

### Escalas (`/admin/relatorios/escalas`)
- Ranking por participacao
- Filtro por mes e departamento
- Breakdown de funcoes e departamentos por membro

### Acolhimento (`/departamentos/acolhimento/relatorio`)
- KPIs + grafico mensal + lista de consolidados

---

## 15. IMPRESSAO (PDF)

### Cartao de Membro
- Layout tipo cartao de credito (85x54mm)
- Header com cor primaria, nome, cargo, contacto, data admissao, status
- Multiplos cartoes por pagina A4

### Lista de Membros
- Tabela A4 com 7 colunas
- Linhas alternadas, header/footer
- Paginacao automatica
- Respeita filtros aplicados na lista

---

## 16. DOCUMENTOS (GDPR / PERMANECER)

- Cada membro tem flags: `aceite`, `data_assinatura`, `validade` (12 meses)
- Dashboard admin mostra membros com documentos pendentes/expirados
- Botao de renovacao no modal (admin pode renovar em nome do membro)
- Membro pode assinar na pagina de termos (`/membros/termos`)

---

## 17. PWA (Progressive Web App)

- `manifest.json` com icones, cores, orientacao portrait
- Service Worker com cache network-first
- Wake Lock no modo palco e cifras
- Ecra completo sem barra do browser
- Funciona com internet lenta (cache de paginas visitadas)

---

## 18. SEGURANCA

| Mecanismo | Implementacao |
|-----------|---------------|
| Auth | Cookie httpOnly + bcryptjs |
| Rate Limiting | Upstash Redis (por email e IP) |
| Tenant Isolation | Prisma extensions (getTenantClient) |
| Role Check | requireAuth() / requireRole() em todas as actions |
| Headers | HSTS, X-Frame-Options, nosniff, strict referrer |
| CORS | Restringido a www.igrejaadmvc.org em producao |
| Audit | AuditLog com categoria, acao, actor, alvo |
| Error Boundaries | Root, /admin, /membros |
| APIs Debug | 404 em producao |

---

## 19. VARIAVEIS DE AMBIENTE

Ver `.env.example` para a lista completa. Principais:

| Variavel | Descricao |
|----------|-----------|
| DATABASE_URL | PostgreSQL connection string |
| KV_REST_API_URL | Upstash Redis URL |
| KV_REST_API_TOKEN | Upstash Redis token |
| RESEND_API_KEY | API key do Resend (emails) |
| BLOB_READ_WRITE_TOKEN | Token do Vercel Blob (uploads) |
| LOYVERSE_ACCESS_TOKEN | Token da API Loyverse (cantina) |

---

## 20. MODELOS DE DADOS (PRISMA)

35 modelos organizados por area:

**Core**: Tenant, Membro, Familia, Congregacao, SuperAdmin, Escolaridade, Cargo

**Departamentos**: Departamento, IntegranteDepartamento, FuncaoDepartamento, FuncaoSelecionada

**Grupos**: Grupo, EncontroGrupo

**Eventos**: Evento, Escala, MensagemEvento, IndisponibilidadeMembro

**Louvor**: Musica (com cifra_interna), RepertorioEvento

**Financeiro**: ObjetivoFinanceiro, LancamentoFinanceiro, Contribuicao, Rifa, RifaNumero, PedidoSaldoCantina

**Visitantes**: Visitante, AcompanhamentoVisitante

**Agenda**: Agenda, Compromisso

**Projectos**: ProjetoObra, EtapaObra

**Inventario**: ItemInventario, MovimentoInventario

**Comunicacao**: AvisoMural

**Auditoria**: AuditLog
