import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId, isAdminUser } from "@/lib/auth";
import { getSquadView } from "@/lib/squad";
import { getActiveRound, isLocked } from "@/lib/round";
import { prisma } from "@/lib/prisma";
import { brl, POSICAO_LABEL } from "@/lib/game";
import Nav from "@/components/Nav";
import {
  buyPlayer,
  sellPlayer,
  buyCoach,
  sellCoach,
} from "@/lib/actions";

const FILTERS = ["Todos", "GOL", "ZAG", "LAT", "MEI", "ATA", "TEC"] as const;
const TAKE = 60;

function Stars({ nota }: { nota: number }) {
  return (
    <span className="text-amber-500" title={`Nota ${nota}`}>
      ★ <span className="text-slate-600">{nota.toFixed(1)}</span>
    </span>
  );
}

export default async function MercadoPage({
  searchParams,
}: {
  searchParams: Promise<{
    pos?: string;
    q?: string;
    sel?: string;
    hoje?: string;
  }>;
}) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const squad = await getSquadView(uid);
  if (!squad) redirect("/login");
  const round = await getActiveRound();
  const locked = isLocked(round);

  const sp = await searchParams;
  const pos = FILTERS.includes((sp.pos ?? "") as (typeof FILTERS)[number])
    ? (sp.pos as string)
    : "Todos";
  const q = (sp.q ?? "").trim();
  const sel = sp.sel && /^\d+$/.test(sp.sel) ? sp.sel : "";
  const hoje = sp.hoje === "1";

  const isTec = pos === "TEC";

  const ownedPlayerIds = new Set(squad.owned.map((p) => p.id));
  const ownedCoachId = squad.coach?.id ?? null;

  const dayMatches = await prisma.match.findMany({
    where: { roundId: round.id },
    select: { selecaoAId: true, selecaoBId: true },
  });
  const playingIds = Array.from(
    new Set(dayMatches.flatMap((m) => [m.selecaoAId, m.selecaoBId]))
  );

  // Seleção tem prioridade; senão, "joga hoje" restringe às seleções da rodada.
  const selFilter = sel
    ? { selecaoId: Number(sel) }
    : hoje
      ? { selecaoId: { in: playingIds } }
      : {};

  const selecoes = await prisma.selecao.findMany({
    orderBy: [{ grupo: "asc" }, { nome: "asc" }],
    select: { id: true, nome: true, grupo: true },
  });

  const players = isTec
    ? []
    : await prisma.player.findMany({
        where: {
          ...(pos !== "Todos" ? { posicao: pos } : {}),
          ...selFilter,
          ...(q ? { nome: { contains: q, mode: "insensitive" } } : {}),
        },
        include: { selecao: true },
        orderBy: [{ nota: "desc" }, { preco: "desc" }],
        take: TAKE,
      });

  const coaches = isTec
    ? await prisma.coach.findMany({
        where: {
          ...selFilter,
          ...(q ? { nome: { contains: q, mode: "insensitive" } } : {}),
        },
        include: { selecao: true },
        orderBy: [{ nota: "desc" }],
        take: TAKE,
      })
    : [];

  const buildHref = (over: { pos?: string; hoje?: boolean } = {}) => {
    const p = new URLSearchParams();
    const pp = over.pos ?? pos;
    if (pp && pp !== "Todos") p.set("pos", pp);
    if (sel) p.set("sel", sel);
    if (q) p.set("q", q);
    const h = over.hoje ?? hoje;
    if (h) p.set("hoje", "1");
    const s = p.toString();
    return "/mercado" + (s ? "?" + s : "");
  };

  return (
    <div className="flex flex-1 flex-col">
      <Nav
        userName={squad.user.name}
        credits={squad.credits}
        active="mercado"
        isAdmin={isAdminUser(squad.user)}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link
            href={buildHref({ hoje: !hoje })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              hoje
                ? "bg-emerald-700 text-white"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {hoje ? "✓ Joga hoje" : "Só quem joga hoje"}
          </Link>
          {hoje && playingIds.length === 0 && (
            <span className="text-xs text-slate-500">
              Nenhum jogo cadastrado nesta rodada ainda.
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={buildHref({ pos: f })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                pos === f
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>

        <form method="get" className="mb-4 flex flex-wrap gap-2">
          {pos !== "Todos" && <input type="hidden" name="pos" value={pos} />}
          {hoje && <input type="hidden" name="hoje" value="1" />}
          <select
            name="sel"
            defaultValue={sel}
            className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
          >
            <option value="">Todas as seleções</option>
            {selecoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grupo ? `[${s.grupo}] ` : ""}
                {s.nome}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome..."
            className="min-w-[140px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Filtrar
          </button>
        </form>

        {locked && (
          <div className="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Mercado fechado para esta rodada — você pode olhar, mas não comprar
            ou vender agora.
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!isTec &&
            players.map((p) => {
              const owned = ownedPlayerIds.has(p.id);
              const req = squad.req[p.posicao as keyof typeof squad.req] ?? 0;
              const have =
                squad.byPos[p.posicao as keyof typeof squad.byPos]?.length ?? 0;
              const full = have >= req;
              const poor = squad.credits < p.preco;
              const label = locked
                ? "Fechado"
                : full
                  ? "Posição cheia"
                  : poor
                    ? "Sem saldo"
                    : "Comprar";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {p.nome}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {p.selecao.nome} · {p.posicao}
                      {p.clube ? ` · ${p.clube}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs">
                      <Stars nota={p.nota} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 pl-2">
                    <span className="text-sm font-medium text-emerald-700">
                      {brl(p.preco)}
                    </span>
                    {owned ? (
                      <form action={sellPlayer}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button
                          disabled={locked}
                          className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Vender
                        </button>
                      </form>
                    ) : (
                      <form action={buyPlayer}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button
                          disabled={locked || full || poor}
                          className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {label}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}

          {isTec &&
            coaches.map((c) => {
              const owned = ownedCoachId === c.id;
              const full = !!squad.coach && !owned;
              const poor = squad.credits < c.preco;
              const label = locked
                ? "Fechado"
                : full
                  ? "Já tem técnico"
                  : poor
                    ? "Sem saldo"
                    : "Comprar";
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {c.nome}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {c.selecao.nome} · Técnico
                    </div>
                    <div className="mt-0.5 text-xs">
                      <Stars nota={c.nota} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 pl-2">
                    <span className="text-sm font-medium text-emerald-700">
                      {brl(c.preco)}
                    </span>
                    {owned ? (
                      <form action={sellCoach}>
                        <button
                          disabled={locked}
                          className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Vender
                        </button>
                      </form>
                    ) : (
                      <form action={buyCoach}>
                        <input type="hidden" name="coachId" value={c.id} />
                        <button
                          disabled={locked || full || poor}
                          className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {label}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          {isTec
            ? `${coaches.length} técnicos`
            : `Mostrando ${players.length} jogadores${
                players.length === TAKE ? " (refine pela busca para ver mais)" : ""
              }`}
          {q ? ` · busca: "${q}"` : ""}
        </p>
      </main>
    </div>
  );
}
