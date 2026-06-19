import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { brl, STARTING_CREDITS } from "@/lib/game";

export default async function RegistrarPage({
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
            Você começa com {brl(STARTING_CREDITS)} para montar seu time.
          </p>
        </div>
        <form
          action={register}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-medium text-slate-800">Criar conta</h2>
          {erro === "email" && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Já existe uma conta com esse e-mail.
            </p>
          )}
          {erro === "dados" && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Preencha nome, e-mail e uma senha de 4+ caracteres.
            </p>
          )}
          <input
            name="name"
            required
            placeholder="Seu nome (ou do time)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
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
            minLength={4}
            placeholder="Senha"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Criar conta e começar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-emerald-700">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
