⛪ ADMVC - Sistema Integrado de Acolhimento & Gestão
"Sê muito bem-vindo, fica para sempre!" > Uma plataforma moderna desenvolvida para a Igreja ADMVC, focada em transformar o primeiro contacto de um visitante numa jornada de discipulado e cuidado.

📖 Sobre o Projeto
O ADMVC Core é uma aplicação web de alta performance que centraliza a comunicação entre o site público e a equipa de obreiros. O sistema automatiza o registo de novos visitantes, gere pedidos de oração e permite um acompanhamento detalhado de cada pessoa que entra em contacto com a igreja, seja presencialmente ou via digital.

🌟 Diferenciais
Design Premium: Interface minimalista, focada na paleta "Figueira" (#3F6B4F).

Experiência do Utilizador: Navegação fluida com animações framer-motion e tailwindcss-animate.

Foco no Cuidado: Automatização de notificações via e-mail para resposta imediata da equipa.

🛠️ Stack Tecnológica
O projeto utiliza as tecnologias mais modernas do ecossistema Fullstack:

Framework: Next.js 15+ (App Router & Server Actions).

Linguagem: TypeScript (Tipagem estrita para maior segurança).

Base de Dados: PostgreSQL via Prisma ORM.

Estilização: Tailwind CSS (Arquitetura baseada em componentes).

E-mails: Resend (Infraestrutura de alta entregabilidade).

Iconografia: Lucide React.

🚀 Funcionalidades Principais
1. Portal Público (/boasvindas & /contato)
Formulário de boas-vindas otimizado para dispositivos móveis.

Captação de pedidos de oração e dados de contacto.

Fluxo inteligente: diferenciação automática entre contactos gerais e novos visitantes.

2. Dashboard de Acolhimento (/membros/dashboard)
Gestão de Contactos: Lista dinâmica de visitantes com filtros de status.

Relatos Rápidos: Inserção de notas de acompanhamento via WhatsApp com um clique.

Histórico Detalhado: Registo cronológico de todas as interações com o visitante.

Construção da Obra: Visualização em tempo real do progresso das etapas da nova sede.

3. Automação de Notificações
Smart Mailer: Envio de notificações personalizadas para a equipa interna.

WhatsApp Integration: Botões dinâmicos que iniciam conversas diretas com o número do visitante sem necessidade de gravar o contacto manualmente.

🏗️ Arquitetura de Ficheiros
Plaintext
├── actions/              # Server Actions (Lógica de base de dados e e-mail)
├── app/                  # Rotas e Páginas (App Router)
├── components/           # Componentes UI (Cards, Modais, Formulários)
├── lib/                  # Utilitários (Prisma Client, Configurações de E-mail)
├── prisma/               # Schema e Migrações da Base de Dados
└── public/               # Assets estáticos (Imagens e Logos)
⚙️ Configuração Local
Clonar o repositório:

Bash
git clone https://github.com/teu-usuario/admvc-site.git
Instalar dependências:

Bash
npm install
Configurar Variáveis de Ambiente (.env.local):

Fragmento do código
DATABASE_URL="postgresql://..."
RESEND_API_KEY="re_..."
NEXTAUTH_SECRET="..."
Sincronizar Base de Dados:

Bash
npx prisma db push
Iniciar em desenvolvimento:

Bash
npm run dev
🎨 Identidade Visual
O projeto utiliza variáveis CSS personalizadas para garantir consistência:

Figueira: #3F6B4F (A cor da nossa essência)

Soft: #7FAE93 (Transições e estados secundários)

Bg2: Fundo neutro premium para leitura prolongada.

📄 Licença
Este projeto é de uso exclusivo da Igreja Assembleia de Deus Ministério Visão de Conquista (ADMVC). Todos os direitos reservados.

Próximos Passos
[ ] Implementação de notificações Push para obreiros.

[ ] Relatórios mensais automáticos em PDF.

[ ] Integração com API oficial do WhatsApp Business.

Desenvolvido com ❤️ para o Reino.