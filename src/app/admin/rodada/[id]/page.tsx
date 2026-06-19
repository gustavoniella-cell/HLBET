import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveTeamScouts } from "@/lib/admin-actions";
import Nav from "@/components/Nav";

const ORDER: Record<string, number> = { GOL: 0, ZAG: 1, LAT: 2, MEI: 3, ATA: 4 };

function NumField({
  name,
  label,
  def,
}: {
  name: string;
  label: string;
  def?: number;
}) {
  return (
    <label className="flex flex-col items-center gap-0.5 text-[10px] text-slate-500">
      {label}
      <input
        type="number"
        name={name}
        min={0}
        defaultValue={def || ""}
        className="w-12 rounded border border-slate-300 px-1 py-1 text-center text-sm text-slate-900"
      />
    </label>
  );
}

function ChkField({
  name,
  label,
  def,
}: {
  name: string;
  label: string;
  def?: boolean;
}) {
  return (
    <label className="flex flex-col items-center gap-0.5 text-[10px] text-slate-500">
      {label}
      <input
        type="checkbox"
        name={name}
        defaultChecked={def}
        className="h-5 w-5 rounded border-slate-300"
      />
    </label>
  );
}

export default async function AdminRodadaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sel?: string; ok?: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/time");

  const roundId = Number((await params).id);
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) redirect("/admin");

  const sp = await searchParams;
  const selId = sp.sel ? Number(sp.sel) : null;

  const selecoes = await prisma.selecao.findMany({
    orderBy: [{ grupo: "asc" }, { nome: "asc" }],
  });

  const selecao = selId
    ? await prisma.selecao.findUnique({ where: { id: selId } })
    : null;

  const players = selecao
    ? (await prisma.player.findMany({ where: { selecaoId: selecao.id } })).sort(
        (a, b) =>
          (ORDER[a.posicao] ?? 9) - (ORDER[b.posicao] ?? 9) ||
          b.nota - a.nota
      )
    : [];

  const teamStat = selecao
    ? await prisma.teamRoundStat.findUnique({
        where: { roundId_selecaoId: { roundId, selecaoId: selecao.id } },
      })
    : null;

  const stats = selecao
    ? await prisma.playerRoundStat.findMany({
        where: { roundId, player: { selecaoId: selecao.id } },
      })
    : [];
  const statBy = new Map(stats.map((s) => [s.playerId, s]));

  const locked = round!.isScored;

  return (
    <div className="flex flex-1 flex-col">
      <Nav
        userName={admin.name}
        credits={admin.credits}
        active="admin"
        isAdmin
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Link href="/admin" className="text-sm text-emerald-700">
            ← Painel
          </Link>
          <span className="text-sm text-slate-400">/ {round!.nome}</span>
        </div>

        <form action={`/admin/rodada/${roundId}`} method="get" className="mb-4 flex gap-2">
          <select
            name="sel"
            defaultValue={selId ?? ""}
            className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
          >
            <option value="" disabled>
              Escolha a seleção...
            </option>
            {selecoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grupo ? `[${s.grupo}] ` : ""}
                {s.nome}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Trocar
          </button>
        </form>

        {sp.ok && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Eventos salvos.
          </div>
        )}
        {locked && (
          <div className="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Esta rodada já foi apurada — lançamentos bloqueados.
          </div>
        )}

        {!selecao ? (
          <p className="text-sm text-slate-500">
            Escolha uma seleção acima para lançar os eventos do jogo.
          </p>
        ) : (
          <form action={saveTeamScouts} className="space-y-4">
            <input type="hidden" name="roundId" value={roundId} />
            <input type="hidden" name="selecaoId" value={selecao.id} />

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold text-slate-800">
                {selecao.nome} — placar do jogo
              </h2>
              <div className="flex flex-wrap items-end gap-4">
                <NumField name="golsPro" label="Gols pró" def={teamStat?.golsPro} />
                <NumField
                  name="golsSofridos"
                  label="Gols sofridos"
                  def={teamStat?.golsSofridos}
                />
                <ChkField
                  name="classificou"
                  label="Classificou"
                  def={teamStat?.classificou}
                />
                <p className="text-xs text-slate-400">
                  Gols sofridos = 0 dá o bônus de “jogo sem sofrer gol” para
                  goleiro/defesa e técnico.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2">
              {players.map((p) => {
                const s = statBy.get(p.id);
                const gk = p.posicao === "GOL";
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-2 py-2 last:border-0"
                  >
                    <div className="min-w-[120px] flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {p.nome}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.posicao}
                        {p.numero ? ` · #${p.numero}` : ""}
                      </div>
                    </div>
                    <ChkField name={`j_${p.id}`} label="Jogou" def={s?.jogou} />
                    <NumField name={`g_${p.id}`} label="Gols" def={s?.gols} />
                    <NumField name={`a_${p.id}`} label="Assis" def={s?.assist} />
                    <ChkField name={`ca_${p.id}`} label="CA" def={s?.amarelo} />
                    <ChkField name={`cv_${p.id}`} label="CV" def={s?.vermelho} />
                    <ChkField name={`m_${p.id}`} label="Craque" def={s?.motm} />
                    <NumField name={`gc_${p.id}`} label="G.contra" def={s?.golContra} />
                    <NumField name={`pp_${p.id}`} label="Pên.perd" def={s?.penPerd} />
                    {gk && (
                      <>
                        <NumField name={`def_${p.id}`} label="Defesas" def={s?.defesas} />
                        <NumField name={`pd_${p.id}`} label="Pên.def" def={s?.penDef} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {!locked && (
              <div className="sticky bottom-0 -mx-3 border-t border-slate-200 bg-white/90 px-3 py-3 backdrop-blur">
                <button className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800">
                  Salvar eventos de {selecao.nome}
                </button>
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
