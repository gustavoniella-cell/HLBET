"use client";

import { useEffect, useState } from "react";

export default function Countdown({ lockAt }: { lockAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span className="tabular-nums">—</span>;

  const diff = new Date(lockAt).getTime() - now;
  if (diff <= 0)
    return <span className="font-medium text-rose-200">fechado</span>;

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return (
    <span className="tabular-nums">
      {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
    </span>
  );
}
