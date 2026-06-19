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
    <header className="bg-[#0d1523] text-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="HL BET"
          className="h-9 w-auto shrink-0"
        />
        <nav className="flex gap-1 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                active === t.key
                  ? "bg-white text-[#0d1523]"
                  : "text-slate-200 hover:bg-white/10"
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
                  ? "bg-white text-[#0d1523]"
                  : "bg-amber-400/90 text-amber-950 hover:bg-amber-300"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-slate-300 sm:inline">{userName}</span>
          <span className="rounded-md bg-white/10 px-2 py-1 font-medium tabular-nums text-[#9fdb6a]">
            {brl(credits)}
          </span>
          <form action={logout}>
            <button className="rounded-md px-2 py-1 text-slate-200 hover:bg-white/10">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
