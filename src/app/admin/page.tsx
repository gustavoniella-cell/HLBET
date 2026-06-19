import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveRound } from "@/lib/round";
import {
  apurarRound,
  runImport,
  runUpdate,
  resetBudgets,
  addMatch,
  removeMatch,
} from "@/lib/admin-actions";
import { STARTING_CREDITS, brl } from "@/lib/game";
import Nav from "@/components/Nav";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    apurado?: string;
    importado?: string;
    atualizado?: string;
    orcamento?: string;
  }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/time");
  const sp = await searchParams;

  const totalSelecoes = await prisma.selecao.count();
  const populated = totalSelecoes > 0;

  const active = await getActiveRound();
  const rounds = await prisma.round.findMany({ orderBy: { numero: "desc" } });
  const selecoes = await prisma.selecao.findMany({
    orderBy: [{ grupo: "asc" }, { nome: "asc" }],
  });

  const [teamsEntered, playersEntered] = await Promise.all([
    prisma.teamRoundStat.count({ where: { roundId: active.id } }),
    prisma.playerRoundStat.count({ where: { roundId: active.id } }),
  ]);

  const matches = await prisma.match.findMany({
    where: { roundId: active.id },
    include: { selecaoA: true, selecaoB: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <Nav
        userName={admin.name}
        credits={admin.credits}
        active="admin"
        isAdmin
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        {sp.apurado && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Rodada apurada! Pontos somados, créditos atualizados e nova rodada
            aberta.
          </div>
        )}
        {sp.importado && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Dados da Copa importados com sucesso.
          </div>
        )}
        {sp.atualizado && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Notas, preços e jogadores atualizados — os times existentes foram
            mantidos.
          </div>
        )}

        {sp.orcamento && (
          <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Orçamento de {brl(STARTING_CREDITS)} aplicado a todos os times.
          </div>
        )}

        {populated && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <form
              action={runUpdate}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="text-sm text-slate-700">
                <div className="font-medium">Atualizar notas e preços</div>
                <div className="text-xs text-slate-500">
                  Aplica notas/preços novos e adiciona jogadores. Não apaga
                  times.
                </div>
              </div>
              <button className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Atualizar
              </button>
            </form>

            <form
              action={resetBudgets}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="text-sm text-slate-700">
                <div className="font-medium">
                  Aplicar orçamento ({brl(STARTING_CREDITS)})
                </div>
                <div className="text-xs text-slate-500">
                  Reaplica o orçamento atual aos times já criados (mantém os
                  jogadores).
                </div>
              </div>
              <button className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Aplicar
              </button>
            </form>
          </div>
        )}

        {!populated && (
          <form
            action={runImport}
            className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <div className="text-sm text-emerald-900">
              <div className="font-medium">Configuração inicial</div>
              <div className="text-xs">
                O banco ainda está vazio. Clique para importar as 48 seleções,
                1.246 jogadores e 48 técnicos da Copa.
              </div>
            </div>
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              Importar dados
            </button>
          </form>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-800">
              Painel do admin — {active.nome}
            </h1>
            <span className="text-xs text-slate-500">
              {teamsEntered} seleções · {playersEntered} lançamentos
            </span>
          </div>

          <div className="mb-4 rounded-lg bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-700">
              Lançar eventos de uma seleção
            </div>
            <form
              action={`/admin/rodada/${active.id}`}
              method="get"
              className="flex gap-2"
            >
              <select
                name="sel"
                className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
                defaultValue=""
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
              <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                Abrir
              </button>
            </form>
          </div>

          <div className="mb-4 rounded-lg bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-700">
              Jogos desta rodada ({matches.length})
            </div>
            {matches.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded bg-white px-2 py-1.5 text-sm"
                  >
                    <span className="text-slate-800">
                      {m.selecaoA.nome}{" "}
                      <span className="text-slate-400">x</span>{" "}
                      {m.selecaoB.nome}
                      {m.horario ? (
                        <span className="text-slate-400"> · {m.horario}</span>
                      ) : null}
                    </span>
                    <form action={removeMatch}>
                      <input type="hidden" name="matchId" value={m.id} />
                      <button className="text-xs text-rose-600 hover:underline">
                        remover
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-xs text-slate-500">
                Nenhum jogo cadastrado. Adicione os jogos do dia para os usuários
                verem.
              </p>
            )}
            <form action={addMatch} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="roundId" value={active.id} />
              <select
                name="selA"
                defaultValue=""
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  Seleção A
                </option>
                {selecoes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">x</span>
              <select
                name="selB"
                defaultValue=""
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  Seleção B
                </option>
                {selecoes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <input
                name="horario"
                placeholder="horário (opcional)"
                className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
                Adicionar jogo
              </button>
            </form>
          </div>

          <form
            action={apurarRound}
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
          >
            <input type="hidden" name="roundId" value={active.id} />
            <div className="text-sm text-amber-900">
              <div className="font-medium">Apurar {active.nome}</div>
              <div className="text-xs">
                Calcula a pontuação, credita os times e abre a próxima rodada.
                Não dá pra desfazer.
              </div>
            </div>
            <button className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              Apurar agora
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-700">Rodadas</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {rounds.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-slate-700">{r.nome}</span>
                {r.isScored ? (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    apurada
                  </span>
                ) : (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    aberta
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
