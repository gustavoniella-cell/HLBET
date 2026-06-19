import { prisma } from "./prisma";
import { FORMATIONS, precoJogador, precoTecnico, nextNoon } from "./game";
import data from "../data/copa_data.json";

type Jogador = {
  nome: string;
  selecao: string;
  posicao: string;
  numero: number | null;
  clube: string | null;
  idade: number | null;
  nota: number;
  confianca: string | null;
  obs: string | null;
};
type SelecaoIn = {
  nome: string;
  grupo: string | null;
  confederacao: string | null;
  ranking: number | null;
  tecnico: string | null;
  escudo: string | null;
};
type TecnicoIn = { nome: string; selecao: string; nota: number };

const game = data as {
  selecoes: SelecaoIn[];
  jogadores: Jogador[];
  tecnicos: TecnicoIn[];
};

// [codigo, categoria, acao, posicao, pontos, fonte, obs]
const SCORING: [string, string, string, string, number, string, string][] = [
  ["jogou", "Geral", "Entrou em campo (>=1 min)", "Todos de linha", 1, "B", ""],
  ["gol_ATA", "Ataque", "Gol", "Atacante", 7, "B", "gol escalado por posição"],
  ["gol_MEI", "Ataque", "Gol", "Meio-campo", 8, "B", ""],
  ["gol_LAT", "Ataque", "Gol", "Lateral", 9, "B", ""],
  ["gol_ZAG", "Ataque", "Gol", "Zagueiro", 10, "B", "defensor que faz gol vale mais"],
  ["gol_GOL", "Ataque", "Gol", "Goleiro", 12, "B", "raríssimo"],
  ["assist", "Ataque", "Assistência", "Todos", 6, "B", ""],
  ["pen_conv", "Ataque", "Pênalti convertido (bônus)", "Todos", 1, "B", "além do gol"],
  ["motm", "Bônus", "Melhor da partida", "Todos", 4, "B", "prêmio FIFA/Sofascore"],
  ["def", "Goleiro", "Defesa", "Goleiro", 1, "B", "cada defesa"],
  ["pen_def", "Goleiro", "Pênalti defendido", "Goleiro", 7, "B", ""],
  ["gs_gk", "Goleiro", "Gol sofrido", "Goleiro", -1, "B", "cada"],
  ["cs_GOL", "Defesa", "Jogo sem sofrer gol (>=60 min)", "Goleiro", 5, "B", ""],
  ["cs_ZAG", "Defesa", "Jogo sem sofrer gol (>=60 min)", "Zagueiro", 5, "B", ""],
  ["cs_LAT", "Defesa", "Jogo sem sofrer gol (>=60 min)", "Lateral", 3, "B", ""],
  ["cs_MEI", "Defesa", "Jogo sem sofrer gol (>=60 min)", "Meio-campo", 1, "B", "volantes"],
  ["amarelo", "Disciplina", "Cartão amarelo", "Todos", -2, "B", ""],
  ["vermelho", "Disciplina", "Cartão vermelho", "Todos", -5, "B", ""],
  ["gol_contra", "Disciplina", "Gol contra", "Todos", -6, "B", ""],
  ["pen_perd", "Disciplina", "Pênalti perdido", "Todos", -4, "B", ""],
  ["des_ZAG", "Avançado", "Desarme", "Zagueiro", 1.5, "A", ""],
  ["des_LAT", "Avançado", "Desarme", "Lateral", 1.5, "A", ""],
  ["des_MEI", "Avançado", "Desarme", "Meio-campo", 1, "A", ""],
  ["corte_ZAG", "Avançado", "Corte/interceptação", "Zagueiro", 1, "A", ""],
  ["cruz_LAT", "Avançado", "Cruzamento certo", "Lateral", 0.5, "A", ""],
  ["key_MEI", "Avançado", "Passe decisivo (key pass)", "Meio-campo", 0.5, "A", ""],
  ["fin_MEI", "Avançado", "Finalização no gol", "Meio-campo", 0.5, "A", ""],
  ["fin_ATA", "Avançado", "Finalização no gol", "Atacante", 0.8, "A", ""],
  ["drible_ATA", "Avançado", "Drible certo", "Atacante", 0.3, "A", ""],
  ["falta", "Avançado", "Falta cometida", "Todos de linha", -0.3, "A", ""],
  ["tec_vitoria", "Técnico", "Vitória", "Técnico", 8, "B", ""],
  ["tec_empate", "Técnico", "Empate", "Técnico", 3, "B", ""],
  ["tec_derrota", "Técnico", "Derrota", "Técnico", -2, "B", ""],
  ["tec_gol_pro", "Técnico", "Cada gol do time", "Técnico", 1, "B", ""],
  ["tec_gol_sofrido", "Técnico", "Cada gol sofrido", "Técnico", -1, "B", ""],
  ["tec_cs", "Técnico", "Jogo sem sofrer gol", "Técnico", 3, "B", ""],
  ["tec_classificou", "Técnico", "Classificação p/ próxima fase", "Técnico", 10, "B", ""],
  ["conv_percentual", "Conversão", "% dos pontos da rodada que vira crédito", "—", 0.15, "Config", "0.15 = 15% dos pontos viram créditos (mude p/ 0.10 ou 0.20)"],
];

export async function gameIsPopulated(): Promise<boolean> {
  return (await prisma.selecao.count()) > 0;
}

// Importa todos os dados da Copa para o banco. force=false não faz nada se já
// houver dados (uso seguro em produção); force=true zera e reimporta (uso local).
export async function importGameData(opts: { force?: boolean } = {}) {
  if (!opts.force && (await prisma.selecao.count()) > 0) {
    return { skipped: true as const };
  }

  await prisma.userCoach.deleteMany();
  await prisma.userPlayer.deleteMany();
  await prisma.coachRoundStat.deleteMany();
  await prisma.playerRoundStat.deleteMany();
  await prisma.teamRoundStat.deleteMany();
  await prisma.userRoundScore.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.player.deleteMany();
  await prisma.selecao.deleteMany();
  await prisma.scoringRule.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.round.deleteMany();

  for (const [nome, s] of Object.entries(FORMATIONS)) {
    await prisma.formation.create({ data: { nome, ...s } });
  }

  await prisma.scoringRule.createMany({
    data: SCORING.map(([codigo, categoria, acao, posicao, pontos, fonte, obs]) => ({
      codigo,
      categoria,
      acao,
      posicao,
      pontos,
      fonte,
      obs: obs || null,
    })),
  });

  const selId = new Map<string, number>();
  for (const s of game.selecoes) {
    const row = await prisma.selecao.create({
      data: {
        nome: s.nome,
        grupo: s.grupo,
        confederacao: s.confederacao,
        ranking: s.ranking,
        escudo: s.escudo || null,
        coachName: s.tecnico,
      },
    });
    selId.set(s.nome, row.id);
  }

  const players = game.jogadores
    .filter((p) => selId.has(p.selecao))
    .map((p) => ({
      nome: p.nome,
      posicao: p.posicao,
      numero: p.numero,
      clube: p.clube,
      idade: p.idade,
      nota: p.nota,
      preco: precoJogador(p.nota),
      confianca: p.confianca,
      selecaoId: selId.get(p.selecao)!,
    }));
  await prisma.player.createMany({ data: players });

  const coaches = game.tecnicos
    .filter((t) => selId.has(t.selecao))
    .map((t) => ({
      nome: t.nome,
      nota: t.nota,
      preco: precoTecnico(t.nota),
      selecaoId: selId.get(t.selecao)!,
    }));
  await prisma.coach.createMany({ data: coaches });

  await prisma.round.create({
    data: { numero: 1, nome: "Rodada 1", lockAt: nextNoon() },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await prisma.user.updateMany({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });
  }

  return {
    skipped: false as const,
    selecoes: game.selecoes.length,
    jogadores: players.length,
    tecnicos: coaches.length,
  };
}
