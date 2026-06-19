import { redirect } from "next/navigation";
import { getUserId, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";

function fmt(n: number): string {
  const s = n.toFixed(1).replace(".", ",");
  return n > 0 ? `+${s}` : s;
}

export default async function RodadaPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const me = await prisma.user.findUnique({ where: { id: uid } });
  if (!me) redirect("/login");

  const round = await prisma.round.findFirst({
    where: { isScored: true },
    orderBy: { numero: "desc" },
  });

  const nav = (
    <Nav
      userName={me.name}
      credits={me.credits}
      active="ranking"
      isAdmin={isAdminUser(me)}
    />
  );

  if (!round) {
    return (
      <div className="flex flex-1 flex-col">
        {nav}
        <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Nenhuma rodada foi apurada ainda.
          </div>
        </main>
      </div>
    );
  }

  const owned = await prisma.userPlayer.findMany({
    where: { userId: uid },
    include: { player: { include: { selecao: true } } },
  });
  const playerStats = await prisma.playerRoundStat.findMany({
    where: {
      roundId: round.id,
      playerId: { in: owned.map((o) => o.playerId) },
    },
  });
  const statBy = new Map(playerStats.map((s) => [s.playerId, s.pontos]));

  const uc = await prisma.userCoach.findUnique({
    where: { userId: uid },
    include: { coach: { include: { selecao: true } } },
  });
  const coachStat = uc
    ? await prisma.coachRoundStat.findUnique({
        where: { roundId_coachId: { roundId: round.id, coachId: uc.coachId } },
      })
    : null;

  const myScore = await prisma.userRoundScore.findUnique({
    where: { userId_roundId: { userId: uid, roundId: round.id } },
  });

  const lines = owned
    .map((o) => ({
      nome: o.player.nome,
      sel: o.player.selecao.nome,
      pos: o.player.posicao,
      pontos: statBy.get(o.playerId) ?? 0,
    }))
    .sort((a, b) => b.pontos - a.pontos);

  return (
    <div className="flex flex-1 flex-col">
      {nav}
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-[#0d1523] px-4 py-3 text-white">
          <div>
            <div className="text-sm text-slate-300">{round.nome}</div>
            <div className="text-lg font-semibold">Sua pontuação</div>
          </div>
          <div className="text-3xl font-semibold tabular-nums">
            {(myScore?.pontos ?? 0).toFixed(1).replace(".", ",")}
          </div>
        </div>

        {!myScore || myScore.pontos === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            Lembre: o time só pontua com as 12 posições preenchidas no fechamento
            da rodada.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Jogador</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-800">{l.nome}</span>
                    <span className="ml-2 text-xs text-slate-400">{l.sel}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{l.pos}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium tabular-nums ${
                      l.pontos < 0 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {fmt(l.pontos)}
                  </td>
                </tr>
              ))}
              {uc && (
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-800">
                      {uc.coach.nome}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {uc.coach.selecao.nome}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">TEC</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-800">
                    {fmt(coachStat?.pontos ?? 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
