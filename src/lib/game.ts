// Regras puras do jogo (sem dependências) — usado pelo app e pelo seed.

export const STARTING_CREDITS = 120;

export const POSICOES = ["GOL", "ZAG", "LAT", "MEI", "ATA"] as const;
export type Posicao = (typeof POSICOES)[number];

export const POSICAO_LABEL: Record<string, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meio-campo",
  ATA: "Atacante",
  TEC: "Técnico",
};

export type FormationSlots = {
  gol: number;
  zag: number;
  lat: number;
  mei: number;
  ata: number;
  tec: number;
};

export const FORMATIONS: Record<string, FormationSlots> = {
  "3-4-3": { gol: 1, zag: 3, lat: 0, mei: 4, ata: 3, tec: 1 },
  "3-5-2": { gol: 1, zag: 3, lat: 0, mei: 5, ata: 2, tec: 1 },
  "4-3-3": { gol: 1, zag: 2, lat: 2, mei: 3, ata: 3, tec: 1 },
  "4-4-2": { gol: 1, zag: 2, lat: 2, mei: 4, ata: 2, tec: 1 },
  "4-5-1": { gol: 1, zag: 2, lat: 2, mei: 5, ata: 1, tec: 1 },
  "5-3-2": { gol: 1, zag: 3, lat: 2, mei: 3, ata: 2, tec: 1 },
  "5-4-1": { gol: 1, zag: 3, lat: 2, mei: 4, ata: 1, tec: 1 },
};

export const DEFAULT_FORMATION = "4-3-3";

export function reqFor(formation: string, posicao: string): number {
  const f = FORMATIONS[formation] ?? FORMATIONS[DEFAULT_FORMATION];
  return (f as Record<string, number>)[posicao.toLowerCase()] ?? 0;
}

export function precoJogador(nota: number): number {
  // Cúbica: puxa bastante o preço pelo nível (craque caro, reserva barato).
  return Math.round(nota * nota * nota * 0.2 * 10) / 10;
}

export function precoTecnico(nota: number): number {
  return Math.round(nota * nota * 0.35 * 10) / 10;
}

export function nextNoon(now: Date = new Date()): Date {
  const d = new Date(now);
  if (now.getHours() < 12) {
    d.setHours(12, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
  }
  return d;
}

export function brl(v: number): string {
  return "C$ " + v.toFixed(2).replace(".", ",");
}

export type Slot = {
  pos: Posicao;
  idx: number;
  top: number;
  left: number;
  n: number;
};

function spread(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [50];
  return Array.from({ length: n }, (_, i) => 15 + (i * 70) / (n - 1));
}

// Posiciona os 11 titulares no campo a partir das contagens da formação.
export function computeSlots(req: Record<Posicao, number>): Slot[] {
  const slots: Slot[] = [];
  const ata = req.ATA;
  spread(ata).forEach((left, i) =>
    slots.push({ pos: "ATA", idx: i, top: 15, left, n: ata })
  );
  const mei = req.MEI;
  spread(mei).forEach((left, i) =>
    slots.push({ pos: "MEI", idx: i, top: 41, left, n: mei })
  );
  const defN = req.LAT + req.ZAG;
  const defLeft = spread(defN);
  const defOrder: { pos: Posicao; idx: number }[] = [];
  let lat = 0;
  if (req.LAT >= 1) defOrder.push({ pos: "LAT", idx: lat++ });
  for (let z = 0; z < req.ZAG; z++) defOrder.push({ pos: "ZAG", idx: z });
  if (req.LAT >= 2) defOrder.push({ pos: "LAT", idx: lat++ });
  defOrder.forEach((d, i) =>
    slots.push({ ...d, top: 65, left: defLeft[i], n: defN })
  );
  slots.push({ pos: "GOL", idx: 0, top: 88, left: 50, n: 1 });
  return slots;
}

// Largura da vaga no campo, proporcional à lotação da linha (evita sobreposição).
export function slotWidthPct(n: number): number {
  return Math.min(25, Math.floor(92 / Math.max(n, 1)));
}
