import { creditGain, type ConvConfig } from "../src/lib/scoring";

const cfg: ConvConfig = { base: 5, fator: 1.2, recup: 0.2, teto: 8 };
console.log("CONFIG:", cfg, "\n");

console.log("=== Compressão: dobrar pontos NÃO dobra créditos ===");
console.log("pontos | créditos | créd/ponto");
for (const p of [0, 5, 10, 20, 40, 60, 100]) {
  const g = creditGain(cfg, p, 50, 50); // na média => sem recuperação
  console.log(
    `${String(p).padStart(6)} | ${g.toFixed(1).padStart(8)} | ${p ? (g / p).toFixed(2) : "—"}`
  );
}

console.log("\n=== Justiça numa mesma rodada (líder x lanterna) ===");
const lider = creditGain(cfg, 60, 200, 120); // acima da média => sem recuperação
const lanterna = creditGain(cfg, 10, 40, 120); // bem abaixo => recuperação
console.log(`Líder    (60 pts, total 200): +${lider} créditos`);
console.log(`Lanterna (10 pts, total  40): +${lanterna} créditos`);
console.log(
  `Pontos: líder fez 6x mais; créditos: apenas ${(lider / lanterna).toFixed(2)}x ` +
    `(${lanterna >= lider ? "lanterna até ganha mais, e segue na briga" : "diferença bem menor"})`
);

console.log("\n=== Recuperação cresce com a distância da média (teto 8) ===");
for (const atras of [0, 10, 20, 40, 80]) {
  const g = creditGain(cfg, 20, 120 - atras, 120);
  console.log(`${String(atras).padStart(3)} pts abaixo da média -> +${g} créditos (fez 20 na rodada)`);
}
