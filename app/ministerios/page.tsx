// app/ministerios/page.tsx
// (Os horários e responsáveis podem ser preenchidos depois — estrutura já está pronta.)
import Link from "next/link";

type Ministerio = {
  slug: string;
  titulo: string;
  resumo: string;
  publico: string;
  destaques: string[];
  encontros: { dia: string; hora: string; nome: string }[];
  responsavel?: string; // placeholder
  contato?: string; // placeholder
};

const MINISTERIOS: Ministerio[] = [
  {
    slug: "infantil",
    titulo: "Infantil",
    resumo:
      "Discipulado e cuidado com as crianças, ensinando a Palavra de forma apropriada e acolhedora.",
    publico: "Crianças e famílias",
    destaques: [
      "Ensino bíblico e valores cristãos",
      "Ambiente seguro e acolhedor",
      "Integração com a família"
    ],
    encontros: [
      { dia: "Domingo", hora: "—:—", nome: "Atividades / Escola Bíblica" }
    ]
  },
  {
    slug: "jovens",
    titulo: "Jovens",
    resumo:
      "Um ministério para fortalecer a fé, identidade e propósito, com comunhão e discipulado.",
    publico: "Adolescentes e jovens",
    destaques: ["Comunhão", "Palavra e discipulado", "Eventos e encontros"],
    encontros: [{ dia: "Semana", hora: "—:—", nome: "Encontro de Jovens" }]
  },
  {
    slug: "louvor",
    titulo: "Louvor",
    resumo:
      "Serviço de adoração congregacional com reverência, excelência e foco em Cristo.",
    publico: "Igreja em geral",
    destaques: ["Adoração", "Serviço", "Ensaio e preparação"],
    encontros: [{ dia: "Semana", hora: "—:—", nome: "Ensaio" }]
  },
  {
    slug: "acao-social",
    titulo: "Ação Social",
    resumo:
      "Serviço prático à comunidade: cuidado, apoio e iniciativas de amor ao próximo.",
    publico: "Comunidade e igreja",
    destaques: ["Apoio comunitário", "Solidariedade", "Ações pontuais"],
    encontros: [{ dia: "Conforme necessidade", hora: "—", nome: "Ações e campanhas" }]
  },
  {
    slug: "familia",
    titulo: "Família",
    resumo:
      "Fortalecimento de casais e famílias por meio de ensino, comunhão e acompanhamento.",
    publico: "Casais e famílias",
    destaques: ["Ensino e aconselhamento", "Eventos", "Comunhão"],
    encontros: [{ dia: "Conforme calendário", hora: "—", nome: "Encontros e palestras" }]
  },
  {
    slug: "discipulado",
    titulo: "Discipulado",
    resumo:
      "Crescimento espiritual com base na Palavra de Deus: firmar, ensinar e enviar.",
    publico: "Novos convertidos e membros",
    destaques: ["Fundamentos da fé", "Caminhada cristã", "Acompanhamento"],
    encontros: [{ dia: "Semana", hora: "—:—", nome: "Classe / Encontro" }]
  }
];

export default function MinisteriosPage() {
  return (
    <main className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-soft bg-bg2 p-6 md:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgba(63,107,79,0.35)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgba(127,174,147,0.18)" }}
        />

        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-semibold text-fg">
            Nossos <span className="text-figueira">Ministérios</span>
          </h1>

          <p className="text-muted text-base md:text-lg">
            Ministérios existem para servir: edificar a igreja, discipular pessoas e expressar
            o amor de Cristo na comunidade.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/agenda" className="btn btn-primary">
              Ver agenda
            </Link>
            <Link href="/contato" className="btn btn-ghost">
              Quero participar
            </Link>
          </div>
          <div className="pt-2 text-xs text-muted2">
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="grid gap-6 md:grid-cols-3">
        {MINISTERIOS.map((m) => (
          <MinisterioCard key={m.slug} m={m} />
        ))}
      </section>

      {/* DETALHES */}
      <section className="space-y-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-figueira">
              Encontros e Informações
            </h2>
            <p className="text-muted">
              Cada ministério tem o seu foco, público e forma de atuação. Ajuste aqui quando tiver os dados reais.
            </p>
          </div>

          <Link href="/contato" className="text-figueira underline underline-offset-4">
            Fale connosco para integrar
          </Link>
        </div>

        <div className="grid gap-6">
          {MINISTERIOS.map((m) => (
            <MinisterioDetail key={m.slug} m={m} />
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="rounded-2xl border border-soft bg-bg2 p-6 md:p-10 space-y-4">
        <h3 className="text-lg md:text-xl font-semibold text-fg">
          Quer servir ou participar?
        </h3>
        <p className="text-muted">
          Se deseja integrar um ministério, entre em contacto. Vamos orientar o melhor caminho de integração,
          discipulado e participação, com cuidado e organização.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/contato" className="btn btn-primary">
            Quero participar
          </Link>
          <Link href="/permanecer" className="btn btn-ghost">
            Tornar-se membro
          </Link>
        </div>
      </section>
    </main>
  );
}

function MinisterioCard({ m }: { m: Ministerio }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-soft bg-bg2 p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: "rgba(63,107,79,0.16)" }}
      />
      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-soft bg-bg px-3 py-1 text-xs text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--g-figueira)" }} />
          Ministério
        </div>

        <h3 className="text-lg font-semibold text-fg">{m.titulo}</h3>
        <p className="text-sm text-muted">{m.resumo}</p>

        <div className="text-xs text-muted2">
          Público: <span className="text-muted">{m.publico}</span>
        </div>

        <ul className="mt-2 space-y-2 text-sm text-muted">
          {m.destaques.slice(0, 3).map((d) => (
            <li key={d} className="flex gap-2">
              <span className="text-figueira">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MinisterioDetail({ m }: { m: Ministerio }) {
  return (
    <div className="rounded-2xl border border-soft bg-bg2 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-soft bg-bg px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--g-soft)" }} />
            {m.titulo}
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-fg">{m.titulo}</h3>
          <p className="text-sm text-muted max-w-2xl">{m.resumo}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/contato" className="btn btn-primary">
            Quero participar
          </Link>
          <Link href="/agenda" className="btn btn-ghost">
            Ver agenda
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-12">
        {/* Encontros */}
        <div className="md:col-span-7">
          <div className="text-sm font-semibold text-fg">Encontros</div>
          <div className="mt-3 overflow-hidden rounded-xl border border-soft">
            <table className="w-full text-sm">
              <thead className="bg-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-muted">Dia</th>
                  <th className="px-4 py-3 text-left text-muted">Hora</th>
                  <th className="px-4 py-3 text-left text-muted">Atividade</th>
                </tr>
              </thead>
              <tbody>
                {m.encontros.map((h, idx) => (
                  <tr key={`${m.slug}-${idx}`} className="border-t border-soft">
                    <td className="px-4 py-3 text-fg">{h.dia}</td>
                    <td className="px-4 py-3 text-fg">{h.hora}</td>
                    <td className="px-4 py-3 text-muted">{h.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-muted2">
            (Depois substituímos “—:—” pelos horários reais.)
          </div>
        </div>

        {/* Responsável / Contacto */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-xl border border-soft bg-bg p-4">
            <div className="text-sm font-semibold text-fg">Responsável</div>
            <div className="mt-2 text-sm text-muted">{m.responsavel || "A definir"}</div>
          </div>

          <div className="rounded-xl border border-soft bg-bg p-4">
            <div className="text-sm font-semibold text-fg">Contacto</div>
            <div className="mt-2 text-sm text-muted">{m.contato || "A definir"}</div>
          </div>

          <div className="rounded-xl border border-soft bg-bg p-4">
            <div className="text-sm font-semibold text-fg">Público</div>
            <div className="mt-2 text-sm text-muted">{m.publico}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
