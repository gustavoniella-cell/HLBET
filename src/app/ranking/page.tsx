import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";

function fmt(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export default async function RankingPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const me = await prisma.user.findUnique({ where: { id: uid } });
  if (!me) redirect("/login");

  const lastScored = await prisma.round.findFirst({
    where: { isScored: true },
    orderBy: { numero: "desc" },
  });

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { players: true } },
      coach: true,
      roundScores: true,
    },
  });

  const rows = users
    .map((u) => {
      const total = u.roundScores.reduce((s, r) => s + r.pontos, 0);
      const last = lastScored
        ? (u.roundScores.find((r) => r.roundId === lastScored.id)?.pontos ?? 0)
        : 0;
      const filled = Math.min(u._count.players, 11) + (u.coach ? 1 : 0);
      return { u, total, last, filled };
    })
    .sort((a, b) => b.total - a.total || a.u.name.localeCompare(b.u.name));

  return (
    <div className="flex flex-1 flex-col">
      <Nav
        userName={me.name}
        credits={me.credits}
        active="ranking"
        isAdmin={isAdminUser(me)}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        {lastScored ? (
          <div className="mb-3 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>
              Classificação geral · última apurada: {lastScored.nome}.
            </span>
            <Link href="/rodada" className="font-medium underline">
              Ver minha rodada
            </Link>
          </div>
        ) : (
          <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Nenhuma rodada apurada ainda — os pontos aparecem aqui depois da
            primeira apuração.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2 text-center">Montado</th>
                <th className="px-3 py-2 text-right">Última</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isMe = r.u.id === me.id;
                return (
                  <tr
                    key={r.u.id}
                    className={`border-t border-slate-100 ${
                      isMe ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">{i + 1}º</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {r.u.name}
                      {isMe && (
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          você
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500">
                      {r.filled}/12
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {fmt(r.last)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-800">
                      {fmt(r.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
