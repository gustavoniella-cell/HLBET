import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (await getCurrentUser()) redirect("/time");
  const { erro } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-emerald-800">
            HL BET
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monte seu time da Copa e dispute com os amigos.
          </p>
        </div>
        <form
          action={login}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-medium text-slate-800">Entrar</h2>
          {erro && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              E-mail ou senha incorretos.
            </p>
          )}
          <input
            type="email"
            name="email"
            required
            placeholder="E-mail"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Senha"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link href="/registrar" className="font-medium text-emerald-700">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
