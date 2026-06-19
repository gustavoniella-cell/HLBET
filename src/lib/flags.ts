// Mapa das seleções da Copa 2026 para o código ISO da bandeira (flagcdn.com).
const ISO: Record<string, string> = {
  "Coreia do Sul": "kr",
  México: "mx",
  Tchéquia: "cz",
  "África do Sul": "za",
  "Bósnia e Herzegovina": "ba",
  Canadá: "ca",
  Catar: "qa",
  Suíça: "ch",
  Brasil: "br",
  Escócia: "gb-sct",
  Haiti: "ht",
  Marrocos: "ma",
  Austrália: "au",
  "Estados Unidos": "us",
  Paraguai: "py",
  Turquia: "tr",
  Alemanha: "de",
  "Costa do Marfim": "ci",
  Curaçao: "cw",
  Equador: "ec",
  Japão: "jp",
  "Países Baixos": "nl",
  Suécia: "se",
  Tunísia: "tn",
  Bélgica: "be",
  Egito: "eg",
  Irã: "ir",
  "Nova Zelândia": "nz",
  "Arábia Saudita": "sa",
  "Cabo Verde": "cv",
  Espanha: "es",
  Uruguai: "uy",
  França: "fr",
  Iraque: "iq",
  Noruega: "no",
  Senegal: "sn",
  Argentina: "ar",
  Argélia: "dz",
  Jordânia: "jo",
  Áustria: "at",
  Colômbia: "co",
  Portugal: "pt",
  "República Democrática do Congo": "cd",
  Uzbequistão: "uz",
  Croácia: "hr",
  Gana: "gh",
  Inglaterra: "gb-eng",
  Panamá: "pa",
};

export function isoCode(selecao: string): string | null {
  return ISO[selecao] ?? null;
}

export function flagUrl(
  selecao: string,
  w: 20 | 40 | 80 = 40
): string | null {
  const c = ISO[selecao];
  return c ? `https://flagcdn.com/w${w}/${c}.png` : null;
}
