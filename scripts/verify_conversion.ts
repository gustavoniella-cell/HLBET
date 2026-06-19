import { creditGain } from "../src/lib/scoring";

console.log("Conversão = um percentual fixo dos pontos da rodada vira crédito.\n");
for (const pct of [0.1, 0.15, 0.2]) {
  console.log(`--- ${(pct * 100).toFixed(0)}% ---`);
  console.log("pontos -> créditos");
  for (const p of [10, 20, 40, 60, 100]) {
    console.log(`${String(p).padStart(4)} -> ${creditGain(pct, p).toFixed(1)}`);
  }
  console.log();
}
console.log("Pontos negativos não tiram crédito (mínimo 0).");
console.log("Exemplo: creditGain(0.15, -10) =", creditGain(0.15, -10));
