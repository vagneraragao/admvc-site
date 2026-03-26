# ⛪ ADMVC - Sistema Integrado de Acolhimento & Gestão

> **"Sê muito bem-vindo, fica para sempre!"** > Uma plataforma Fullstack de alta performance desenvolvida para a **Igreja ADMVC**, focada em transformar o primeiro contacto de um visitante numa jornada de cuidado, oração e integração ministerial.

---

## 📖 Sobre o Projeto

O **ADMVC Core** é o coração digital da nossa congregação. Ele serve como uma ponte inteligente entre o site público e a liderança, automatizando a captação de novos visitantes e oferecendo aos obreiros uma ferramenta de gestão em tempo real. 

O sistema foi desenhado para que nenhum pedido de oração seja esquecido e que cada pessoa que cruza as nossas portas (físicas ou digitais) receba o devido acompanhamento.

### 🌟 Diferenciais do Sistema
* **Identidade Visual "Figueira":** Interface baseada na paleta institucional (#3F6B4F), unindo sobriedade e acolhimento.
* **Comunicação em Tempo Real:** Notificações automáticas via e-mail (Resend) para a equipa interna.
* **Foco no Cuidado (CRM Espiritual):** Gestão de status de visitantes e histórico de contactos.
* **Transparência da Obra:** Visualização dinâmica do progresso da construção da nova sede.

---

## 🛠️ Stack Tecnológica

O projeto utiliza as tecnologias mais modernas do ecossistema **TypeScript**:

* **Framework:** [Next.js 15+](https://nextjs.org/) (App Router & Server Actions).
* **Base de Dados:** PostgreSQL (Hospedagem em nuvem).
* **ORM:** [Prisma](https://www.prisma.io/) (Type-safety e modelagem relacional).
* **Estilização:** Tailwind CSS & Lucide Icons.
* **E-mails:** [Resend API](https://resend.com/) (Infraestrutura de alta entregabilidade).
* **Animações:** `tailwindcss-animate` para transições suaves.

---

## 🚀 Funcionalidades Detalhadas

### 1. Portal de Captação (`/boasvindas` & `/contato`)
* **Boas-Vindas:** Formulário otimizado para telemóveis, captando Nome, WhatsApp e Pedido de Oração.
* **Página de Contacto:** Triagem de mensagens externas com integração direta à Dashboard de Acolhimento.
* **Smart Labels:** O sistema prefixa automaticamente os contactos (`🌱 [VISITANTE]` ou `✉️ [CONTACTO SITE]`) para facilitar a triagem.

### 2. Dashboard de Gestão do Acolhimento
* **Visualização 360º:** Lista de visitantes com filtros por status (Novo, Em Contacto, Integrado).
* **Relatos Rápidos:** Componente que permite registar conversas de WhatsApp sem sair da página principal.
* **Modais de Acompanhamento:** Histórico detalhado de todas as interações passadas com o visitante.

### 3. Monitorização da Construção (`Página Inicial`)
* **Fé em Números:** Barra de progresso dinâmica que lê os valores da base de dados (`ProjetoObra`).
* **Etapas da Sede:** Visualização percentual automática para:
    1. Aquisição do Terreno
    2. Estrutura e Alvenaria
    3. Acabamentos e Mobiliário

### 4. Automação de E-mail (Workflow)
* **Notificações Internas:** Envio imediato para `admvcff@gmail.com` com:
    * Dados completos do visitante.
    * Botão direto para abrir conversa no **WhatsApp** (sem precisar de gravar o número).
    * Link de acesso rápido à Dashboard de gestão.

---

## 🏗️ Estrutura de Pastas (Arquitetura)

```text
├── actions/              # Server Actions (Lógica de DB e disparo de E-mails)
├── app/                  # Rotas, Layouts e Páginas (App Router)
├── components/           # Componentes UI (Cards, Modais, Progress Bars)
│   └── acolhimento/      # Componentes específicos da gestão de pessoas
├── lib/                  # Utilitários (Prisma Client, Resend Config, Auth)
├── prisma/               # Schema.prisma e Migrações de BD
└── public/               # Assets (Logos, Imagens do Hero, Favicons)

## ⚙️ Configuração do Ambiente

### 1. **Clonar e Instalar:**
```bash
   git clone [https://github.com/teu-usuario/admvc-site.git](https://github.com/teu-usuario/admvc-site.git)
   npm install
```

### 2. Variáveis de Ambiente (.env.local):
* **Crie um ficheiro na raiz do projeto e adicione as suas credenciais:

### Ligação à Base de Dados (PostgreSQL)
DATABASE_URL="postgresql://utilizador:senha@localhost:5432/admvc"

### Chave de API do Resend para envios de E-mail
RESEND_API_KEY="re_sua_chave_privada_aqui"

### Segredo para Autenticação (NextAuth ou similar)
NEXTAUTH_SECRET="um_codigo_aleatorio_e_seguro"

Sincronizar Base de Dados:

### Gera o Cliente Prisma baseado no schema
npx prisma generate  

### Aplica as tabelas na base de dados (Modo Desenvolvimento)
npx prisma db push

### Sincronização da Base de Dados:

### Gera o Cliente Prisma baseado no schema
npx prisma generate  

### Aplica as tabelas na base de dados (Modo Desenvolvimento)
npx prisma db push

### Execução do Projeto:

* Inicia o servidor de desenvolvimento em http://localhost:3000
npm run dev      

* Para gerar a versão de produção
npm run build

## 🎨 Identidade Visual (Design System)
* O projeto segue rigorosamente o manual de marca da congregação:

* Primary (Figueira): #3F6B4F — Usado em botões de ação principal e cabeçalhos.
* Secondary (Soft): #7FAE93 — Usado em estados de hover e elementos de suporte.
* Tipografia: * Títulos: Black Italic (Uppercase) para um visual de impacto e modernidade.
* Corpo: Sans-serif com tracking ajustado para máxima legibilidade.
* Componentes: Cantos arredondados (rounded-[2rem]) para transmitir uma sensação de acolhimento e proximidade.

## 📄 Licença e Propósito
* Este software é de propriedade e uso exclusivo da Igreja Assembleia de Deus - Ministério Visão de Conquista (ADMVC).

* O código foi desenvolvido com o propósito de servir o Reino de Deus, utilizando a excelência tecnológica para potenciar o cuidado com o próximo.

* Desenvolvido com ❤️ pela equipa de tecnologia ADMVC.

