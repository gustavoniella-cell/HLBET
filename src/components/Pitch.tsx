import Link from "next/link";
import { computeSlots, slotWidthPct } from "@/lib/game";
import { flagUrl } from "@/lib/flags";
import { sellPlayer } from "@/lib/actions";
import type { SquadView } from "@/lib/squad";

export default function Pitch({
  squad,
  locked,
}: {
  squad: SquadView;
  locked: boolean;
}) {
  const slots = computeSlots(squad.req);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-emerald-600"
      style={{ aspectRatio: "3 / 4" }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-md border-2 border-white/30" />
      <div className="pointer-events-none absolute left-2 right-2 top-1/2 border-t-2 border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-14 w-36 -translate-x-1/2 border-2 border-b-0 border-white/30" />
      <div className="pointer-events-none absolute top-2 left-1/2 h-14 w-36 -translate-x-1/2 border-2 border-t-0 border-white/30" />

      {slots.map((slot, i) => {
        const player = squad.byPos[slot.pos][slot.idx];
        const flag = player ? flagUrl(player.selecao.nome, 20) : null;
        const ini = player
          ? player.nome
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0] ?? "")
              .join("")
              .toUpperCase()
          : "";
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${slot.top}%`,
              left: `${slot.left}%`,
              width: `${slotWidthPct(slot.n)}%`,
            }}
          >
            {player ? (
              <div className="relative rounded-md bg-white px-1 py-1.5 text-center shadow-sm">
                {!locked && (
                  <form
                    action={sellPlayer}
                    className="absolute -right-2 -top-2 z-10"
                  >
                    <input type="hidden" name="playerId" value={player.id} />
                    <button
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs leading-none text-white hover:bg-rose-700"
                      aria-label={`Vender ${player.nome}`}
                    >
                      ×
                    </button>
                  </form>
                )}
                {player.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.foto}
                    alt={player.nome}
                    className="mx-auto mb-0.5 h-12 w-full rounded object-cover object-top"
                  />
                ) : (
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                    {player.numero ?? ini}
                  </div>
                )}
                <div className="truncate text-[11px] font-medium leading-tight text-slate-900">
                  {player.nome}
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                  {flag && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={flag}
                      alt=""
                      width={14}
                      height={10}
                      className="rounded-[1px]"
                    />
                  )}
                  <span>{slot.pos}</span>
                </div>
                <div className="text-[10px] font-medium text-emerald-700">
                  {player.preco.toFixed(1).replace(".", ",")} HL
                </div>
              </div>
            ) : (
              <Link
                href={`/mercado?pos=${slot.pos}`}
                className="block rounded-md border border-dashed border-white/80 bg-white/15 px-1 py-2 text-center text-[11px] font-medium text-white hover:bg-white/25"
              >
                + {slot.pos}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
