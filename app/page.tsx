// app/page.tsx
import Link from "next/link";
import { MEMBERS_AREA_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

// --- CONFIGURAÇÃO DINÂMICA ---
// Substitua este link pelo link "RAW" do seu arquivo .json no GitHub
// const JSON_URL = "https://raw.githubusercontent.com/TEU_USUARIO/TEU_REPO/main/obra-admvc.json";
const JSON_URL = "https://raw.githubusercontent.com/vagneraragao/admvc-site/refs/heads/main/components/obra-admvc.json";

async function getDadosObra() {
  try {
    const res = await fetch(JSON_URL, {
      next: { revalidate: 3600 } // Atualiza o cache a cada 1 hora
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    // Dados de segurança (Fallback) caso o link do GitHub falhe ou o arquivo seja deletado
    return {
      titulo: "Campanha de Construção: Nossa Sede",
      descricao: "Acompanhe os passos de fé para a nossa sede na Figueira da Foz.",
      objetivoFinal: 750000,
      videoUrl: "https://youtu.be/rHNERaeiZPs?si=cGNKB0rgjgZMaTUR",
      etapas: [
        { nome: "1. Terreno", atual: 0, alvo: 150000 },
        { nome: "2. Estrutura", atual: 0, alvo: 300000 },
        { nome: "3. Acabamentos", atual: 0, alvo: 300000 }
      ]
    };
  }
}

export default async function HomePage() {
  const DADOS_CONSTRUCAO = await getDadosObra();

  // Cálculos de Progresso
  const totalArrecadadoGeral = DADOS_CONSTRUCAO.etapas?.reduce((sum: number, etapa: any) => sum + (etapa.atual || 0), 0) || 0;
  const porcentagemGeral = Math.min(100, Math.round((totalArrecadadoGeral / DADOS_CONSTRUCAO.objetivoFinal) * 100));

  return (
    <main className="space-y-16">

      {/* 1. HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-soft bg-bg2">
        <div className="absolute inset-0">
          <img
            src="/images/hero_teste.png"
            alt="Culto e comunhão na ADMVC"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(63,107,79,0.35)] via-transparent to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.65)]" />
        </div>

        <div className="relative z-10 p-6 md:p-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs text-white/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--g-figueira)" }} />
              {SITE_NAME} • Figueira da Foz · Leiria · Barcelos
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold leading-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
              {SITE_TAGLINE.includes("uma família") ? (
                <>Mais que uma igreja, <span className="text-figueira drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">uma família</span></>
              ) : (
                <span className="text-figueira">{SITE_TAGLINE}</span>
              )}
            </h1>

            <p className="max-w-2xl text-base md:text-lg text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
              Na ADMVC, você encontra uma família apaixonada por Jesus e por pessoas.
              Acreditamos que todo filho de Deus pode ser cuidado e capacitado.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/congregacoes" className="btn btn-primary">Visite-nos</Link>
              <a href={MEMBERS_AREA_URL} className="btn btn-ghost bg-black/35 text-white border-white/25 hover:bg-black/55" target="_blank" rel="noopener noreferrer">
                🔒 Área de Membros
              </a>
              <Link href="/permanecer" className="btn btn-ghost bg-black/35 text-white border-white/25 hover:bg-black/55">Permanecer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ESSÊNCIA */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-figueira">Jesus é o centro. Pessoas são a missão.</h2>
          <p className="text-muted max-w-3xl">A nossa fé é cristocêntrica e a nossa prática é servir e cuidar de pessoas.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard title="Cristo é o Centro" text="Jesus Cristo é o centro de tudo o que fazemos." reference="Cl 1:17-18" />
          <FeatureCard title="Serviço com Propósito" text="Servindo a Deus ao servir pessoas." reference="Mc 10:45 / Gl 5:13" />
          <FeatureCard title="Esperança e Novo Começo" text="Há esperança e um novo começo em Cristo." reference="Jr 29:11" />
        </div>
      </section>

      {/* 3. CONSTRUÇÃO DINÂMICA (DESTAQUE ESPECIAL) */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-figueira/30 bg-bg p-6 md:p-10 space-y-8 shadow-xl shadow-figueira/5">

        {/* Detalhe visual de fundo para dar profundidade */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-figueira/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-figueira text-white text-[10px] font-black uppercase tracking-widest mb-2">
              Campanha Ativa
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-fg tracking-tight">{DADOS_CONSTRUCAO.titulo}</h2>
            <p className="text-base text-muted max-w-xl leading-relaxed">{DADOS_CONSTRUCAO.descricao}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {DADOS_CONSTRUCAO.videoUrl && (
              <a
                href={DADOS_CONSTRUCAO.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-fg text-bg px-6 py-3 text-xs font-bold hover:scale-105 transition-all shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Assista ao Projeto
              </a>
            )}

            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-figueira/20 bg-figueira/5 px-6 py-3 min-w-[120px]">
              <span className="text-[10px] text-figueira font-black uppercase tracking-[0.2em]">Total</span>
              <span className="text-3xl font-black text-figueira">{porcentagemGeral}%</span>
            </div>
          </div>
        </div>

        {/* Grid de Etapas com Cards Internos mais Claros */}
        <div className="relative z-10 grid gap-4 md:grid-cols-3">
          {DADOS_CONSTRUCAO.etapas?.map((etapa: any, index: number) => {
            const porcentagemEtapa = Math.min(100, Math.round(((etapa.atual || 0) / (etapa.alvo || 1)) * 100));
            return (
              <div key={index} className="space-y-4 rounded-2xl border border-soft bg-bg2 p-5 transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-fg text-sm uppercase tracking-tight">{etapa.nome}</h3>
                  <span className="text-xs font-black text-figueira">
                    {porcentagemEtapa}%
                  </span>
                </div>

                <div className="relative h-3 w-full rounded-full bg-soft overflow-hidden shadow-inner">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(63,107,79,0.4)]"
                    style={{ width: `${porcentagemEtapa}%`, backgroundColor: "var(--g-figueira)" }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full animate-pulse ${porcentagemEtapa === 100 ? 'bg-green-500' : 'bg-figueira'}`} />
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">
                    {porcentagemEtapa === 100 ? "Meta Alcançada" : "Contribua com este passo"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUEM SOMOS (ajustado) */}
      <section className="grid gap-8 md:grid-cols-12 md:items-start">
        <div className="md:col-span-5 space-y-3">
          <h2 className="text-xl md:text-2xl font-semibold text-figueira">Quem somos</h2>

          <p className="text-muted">
            A Assembleia de Deus – Ministério Visão de Conquista é uma igreja cristã comprometida
            com a Palavra de Deus, com a família e com a transformação de vidas por meio do
            Evangelho de Jesus Cristo.
          </p>

          <p className="text-muted">
            Acreditamos que todo filho de Deus pode ser cuidado e capacitado. Depois de passar
            por esse processo, torna-se apto a gerar transformação e levar as Boas Novas a todo o
            mundo, como a Bíblia nos ordena.
          </p>

          <div className="pt-2">
            <Link href="/sobre" className="text-figueira underline underline-offset-4">
              Conheça a ADMVC
            </Link>
          </div>
        </div>

        <div className="md:col-span-7 grid gap-4 md:grid-cols-2">
          <FeatureCard title="Acolhimento" desc="Uma comunidade que recebe, cuida e caminha junto." />
          <FeatureCard title="Discipulado" desc="Crescimento espiritual com base na Palavra de Deus." />
          <FeatureCard title="Serviço" desc="Servir é parte da nossa cultura cristã e comunitária." />
          <FeatureCard title="Unidade" desc="Mais que uma igreja, uma família — em amor e comunhão." />
        </div>
      </section>

      {/* CONGREGAÇÕES */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-figueira">
              Nossas Congregações
            </h2>
            <p className="text-muted">Sede como principal, com congregações em Leiria e Barcelos.</p>
          </div>
          <Link href="/congregacoes" className="text-figueira underline underline-offset-4">
            Ver horários e endereços
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PlaceCard
            badge="Sede"
            title="Figueira da Foz"
            desc="Cultos e encontros semanais"
            accent="figueira"
          />
          <PlaceCard
            badge="Congregação"
            title="Leiria"
            desc="Uma comunidade em crescimento"
            accent="soft"
          />
          <PlaceCard
            badge="Congregação"
            title="Barcelos"
            desc="Caminhando juntos em fé"
            accent="deep"
          />
        </div>
      </section>

      {/* VIDA NA IGREJA / MINISTÉRIOS */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-figueira">Vida na Igreja</h2>
            <p className="text-muted">Ministérios que fortalecem a fé, a comunhão e o serviço.</p>
          </div>
          <Link href="/ministerios" className="text-figueira underline underline-offset-4">
            Conheça nossos ministérios
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard title="Infantil" />
          <MiniCard title="Jovens" />
          <MiniCard title="Louvor" />
          <MiniCard title="Ação Social" />
          <MiniCard title="Família" />
          <MiniCard title="Discipulado" />
        </div>
      </section>

      {/* 7. ÂNCORA BÍBLICA */}
      <section className="rounded-2xl border border-soft bg-bg2 p-8 text-center md:text-left">
        <div className="border-l-4 md:pl-6 border-figueira inline-block">
          <p className="text-xl md:text-2xl italic text-fg">“Jesus Cristo é o centro de tudo o que fazemos.”</p>
          <div className="pt-2 text-sm text-muted2 font-medium">Colossenses 1:17-18</div>
        </div>
      </section>

      {/* 8. CALLOUTS FINAIS */}
      <section className="grid gap-4 md:grid-cols-2">
        <Callout title="Quer tornar-se membro?" desc="O Permanecer é o caminho para se integrar à nossa família." ctaLabel="Saber mais" ctaHref="/permanecer" variant="soft" />
        {/*  <Callout title="Área de Membros" desc="Acesso exclusivo para acompanhamento interno." ctaLabel="Entrar" ctaHref={MEMBERS_AREA_URL} external variant="figueira" lock />*/}

        <Callout
          title="Área de Membros"
          desc="Acesso exclusivo para membros da ADMVC. Entre para acompanhar os seus cupons, escalas e comunicados internos."
          ctaLabel="Entrar"
          ctaHref="/membros" // MUDE ISTO: Deixe de usar MEMBERS_AREA_URL e use /membros
          // external // MUDE ISTO: Remova a propriedade external
          variant="figueira"
          lock
        />

      </section>

    </main>
  );
}

// --- COMPONENTES AUXILIARES ---

function FeatureCard({ title, desc, text, reference }: { title: string; desc?: string; text?: string; reference?: string; }) {
  return (
    <div className="rounded-2xl border border-soft bg-bg2 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--g-soft)" }} />
        <h3 className="font-semibold text-fg text-sm">{title}</h3>
      </div>
      {desc && <p className="mt-2 text-xs text-muted leading-relaxed">{desc}</p>}
      {text && (
        <>
          <p className="mt-3 text-sm text-fg leading-relaxed">“{text}”</p>
          <div className="mt-2 text-[10px] font-bold text-figueira uppercase tracking-wider">{reference}</div>
        </>
      )}
    </div>
  );
}

function PlaceCard({ badge, title, desc, accent }: { badge: string; title: string; desc: string; accent: "figueira" | "deep" | "soft"; }) {
  const accentColor = accent === "figueira" ? "rgba(63,107,79,0.15)" : accent === "deep" ? "rgba(46,79,58,0.15)" : "rgba(127,174,147,0.15)";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-soft bg-bg2 p-5 group cursor-default">
      <div aria-hidden className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl transition-opacity group-hover:opacity-80" style={{ background: accentColor }} />
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center rounded-full border border-soft bg-bg px-2.5 py-0.5 text-[10px] font-bold text-muted uppercase">{badge}</div>
        <h3 className="text-lg font-bold text-fg">{title}</h3>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </div>
  );
}

function Callout({ title, desc, ctaLabel, ctaHref, external, variant, lock }: { title: string; desc: string; ctaLabel: string; ctaHref: string; external?: boolean; variant: "figueira" | "soft"; lock?: boolean; }) {
  const bg = variant === "figueira" ? "rgba(63,107,79,0.12)" : "rgba(127,174,147,0.12)";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-soft bg-bg2 p-6 md:p-8">
      <div aria-hidden className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-50" style={{ background: bg }} />
      <div className="relative z-10 space-y-4">
        <h3 className="text-xl font-bold text-fg">{lock ? "🔒 " : ""}{title}</h3>
        <p className="text-sm text-muted max-w-xs">{desc}</p>
        {external ? (
          <a href={ctaHref} className="btn btn-primary inline-flex" target="_blank" rel="noopener noreferrer">{ctaLabel}</a>
        ) : (
          <Link href={ctaHref} className="btn btn-primary inline-flex">{ctaLabel}</Link>
        )}
      </div>
    </div>
  );
}

function MiniCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-soft bg-bg2 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-fg">{title}</h3>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--g-figueira)" }}
        />
      </div>
      <p className="mt-2 text-sm text-muted">
        Conteúdo e atividades voltadas para edificação e comunhão.
      </p>
    </div>
  );
}