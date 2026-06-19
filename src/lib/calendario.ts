import cal from "../data/calendario.json";

export type CalMatch = {
  date: string;
  hora: string | null;
  teamA: string;
  teamB: string;
  group: string;
};

export const calendario = cal as CalMatch[];

export function datasComJogos(): string[] {
  return [...new Set(calendario.map((m) => m.date))].sort();
}

export function jogosDaData(date: string): CalMatch[] {
  return calendario.filter((m) => m.date === date);
}

export function formatData(date: string): string {
  const [, mo, d] = date.split("-");
  return `${d}/${mo}`;
}
