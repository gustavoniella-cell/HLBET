import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId, isAdminUser } from "@/lib/auth";
import { getSquadView } from "@/lib/squad";
import { getActiveRound, isLocked } from "@/lib/round";
import { brl } from "@/lib/game";
import Nav from "@/components/Nav";
import Pitch from "@/components/Pitch";
import Countdown from "@/components/Countdown";
import FormationSelect from "@/components/FormationSelect";
import { sellCoach } from "@/lib/actions";

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

export default async function TimePage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const squad = await getSquadView(uid);
  if (!squad) redirect("/login");
  const round = await getActiveRound();
  const locked = isLocked(round);

  return (
    <div className="flex flex-1 flex-col">
      <Nav
        userName={squad.user.name}
        credits={squad.credits}
        active="time"
        isAdmin={isAdminUser(squad.user)}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Em caixa" value={brl(squad.credits)} />
            <Metric label="Patrimônio" value={brl(squad.patrimonio)} />
            <Metric
              label="Posições"
              value={`${squad.filled}/${squad.totalSlots}`}
            />
            <Metric
              label="Mercado fecha"
              value={<Countdown lockAt={round.lockAt.toISOString()} />}
            />
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Esquema</span>
              <FormationSelect value={squad.formationName} disabled={locked} />
            </div>
            <Link
              href="/mercado"
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Ir ao mercado
            </Link>
          </div>

          {locked ? (
            <div className="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              Mercado fechado para esta rodada. Reabre após os jogos.
            </div>
          ) : squad.complete ? (
            <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              Time completo! Pronto para pontuar na rodada.
            </div>
          ) : (
            <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Faltam {squad.totalSlots - squad.filled} posição(ões). O time só
              pontua com as 12 preenchidas.
            </div>
          )}

          <div className="mx-auto max-w-sm">
            <Pitch squad={squad} locked={locked} />
          </div>

          <div className="mx-auto mt-3 flex max-w-sm items-center gap-3">
            <span className="text-sm text-slate-500">Técnico</span>
            {squad.coach ? (
              <div className="flex flex-1 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {squad.coach.nome}
                  </div>
                  <div className="text-xs text-slate-500">
                    {squad.coach.selecao.nome} · {brl(squad.coach.preco)}
                  </div>
                </div>
                {!locked && (
                  <form action={sellCoach}>
                    <button className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100">
                      Vender
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <Link
                href="/mercado?pos=TEC"
                className="flex-1 rounded-md border border-dashed border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                + Escalar técnico
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
