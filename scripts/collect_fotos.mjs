import { readFileSync, writeFileSync } from "node:fs";

const FILE = "/Users/gustavoniella/copa-fantasy/web/src/data/copa_data.json";
const KEY = "3";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const data = JSON.parse(readFileSync(FILE, "utf-8"));
// Processa dos melhores jogadores para os piores (craques primeiro).
const order = data.jogadores
  .map((p, idx) => ({ p, idx }))
  .sort((a, b) => (b.p.nota ?? 0) - (a.p.nota ?? 0));

let found = data.jogadores.filter((p) => p.foto).length;
let miss = data.jogadores.filter((p) => "foto" in p && !p.foto).length;
let done = 0;

async function fetchFoto(nome) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${KEY}/searchplayers.php?p=${encodeURIComponent(nome)}`
      );
      if (res.status === 429) {
        await sleep(25000);
        continue;
      }
      const j = await res.json();
      const list = (j.player || []).filter((x) => x.strSport === "Soccer");
      const m = list.find((x) => norm(x.strPlayer) === norm(nome)) || list[0];
      return m ? m.strCutout || m.strThumb || null : null;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

for (const { p } of order) {
  if (p.foto !== undefined) continue;
  p.foto = await fetchFoto(p.nome);
  if (p.foto) found++;
  else miss++;
  done++;
  if (done % 20 === 0) {
    writeFileSync(FILE, JSON.stringify(data, null, 1));
    console.log(`processados nesta sessão: ${done} | com foto total: ${found} | sem: ${miss}`);
  }
  await sleep(2500);
}

writeFileSync(FILE, JSON.stringify(data, null, 1));
console.log(`FIM: ${found} com foto, ${miss} sem, de ${data.jogadores.length}`);
