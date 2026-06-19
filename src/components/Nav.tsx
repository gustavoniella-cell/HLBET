import Link from "next/link";
import { logout } from "@/lib/actions";
import { brl } from "@/lib/game";

const tabs = [
  { key: "time", href: "/time", label: "Meu time" },
  { key: "mercado", href: "/mercado", label: "Mercado" },
  { key: "ranking", href: "/ranking", label: "Ranking" },
] as const;

export default function Nav({
  userName,
  credits,
  active,
  isAdmin,
}: {
  userName: string;
  credits: number;
  active: "time" | "mercado" | "ranking" | "admin";
  isAdmin?: boolean;
}) {
  return (
    <header className="bg-emerald-800 text-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3">
        <span className="shrink-0 whitespace-nowrap font-semibold tracking-tight">
          HL BET
        </span>
        <nav className="flex gap-1 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                active === t.key
                  ? "bg-white text-emerald-800"
                  : "text-emerald-50 hover:bg-emerald-700"
              }`}
            >
              {t.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                active === "admin"
                  ? "bg-white text-emerald-800"
                  : "bg-amber-400/90 text-amber-950 hover:bg-amber-300"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-emerald-100 sm:inline">{userName}</span>
          <span className="rounded-md bg-emerald-900/50 px-2 py-1 font-medium tabular-nums">
            {brl(credits)}
          </span>
          <form action={logout}>
            <button className="rounded-md px-2 py-1 text-emerald-100 hover:bg-emerald-700">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
