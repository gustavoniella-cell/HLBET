"use client";

import { setFormation } from "@/lib/actions";
import { FORMATIONS } from "@/lib/game";

export default function FormationSelect({
  value,
  disabled,
}: {
  value: string;
  disabled?: boolean;
}) {
  return (
    <form action={setFormation}>
      <select
        name="formation"
        defaultValue={value}
        disabled={disabled}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-800 disabled:opacity-50"
        aria-label="Esquema tático"
      >
        {Object.keys(FORMATIONS).map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </form>
  );
}
