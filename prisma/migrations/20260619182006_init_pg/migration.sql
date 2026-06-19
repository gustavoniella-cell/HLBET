-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "formation" TEXT NOT NULL DEFAULT '4-3-3',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selecao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" TEXT,
    "confederacao" TEXT,
    "ranking" INTEGER,
    "escudo" TEXT,
    "coachName" TEXT,

    CONSTRAINT "Selecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "posicao" TEXT NOT NULL,
    "numero" INTEGER,
    "clube" TEXT,
    "idade" INTEGER,
    "nota" DOUBLE PRECISION NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "confianca" TEXT,
    "selecaoId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "selecaoId" INTEGER NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlayer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "UserPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoach" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" INTEGER NOT NULL,

    CONSTRAINT "UserCoach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "nome" TEXT NOT NULL,
    "gol" INTEGER NOT NULL,
    "zag" INTEGER NOT NULL,
    "lat" INTEGER NOT NULL,
    "mei" INTEGER NOT NULL,
    "ata" INTEGER NOT NULL,
    "tec" INTEGER NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("nome")
);

-- CreateTable
CREATE TABLE "ScoringRule" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT,
    "categoria" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "posicao" TEXT NOT NULL,
    "pontos" DOUBLE PRECISION NOT NULL,
    "fonte" TEXT NOT NULL,
    "obs" TEXT,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "lockAt" TIMESTAMP(3) NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isScored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRoundStat" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "selecaoId" INTEGER NOT NULL,
    "golsPro" INTEGER NOT NULL DEFAULT 0,
    "golsSofridos" INTEGER NOT NULL DEFAULT 0,
    "classificou" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamRoundStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRoundStat" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "jogou" BOOLEAN NOT NULL DEFAULT false,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assist" INTEGER NOT NULL DEFAULT 0,
    "amarelo" BOOLEAN NOT NULL DEFAULT false,
    "vermelho" BOOLEAN NOT NULL DEFAULT false,
    "golContra" INTEGER NOT NULL DEFAULT 0,
    "penPerd" INTEGER NOT NULL DEFAULT 0,
    "penDef" INTEGER NOT NULL DEFAULT 0,
    "defesas" INTEGER NOT NULL DEFAULT 0,
    "motm" BOOLEAN NOT NULL DEFAULT false,
    "pontos" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerRoundStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachRoundStat" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "coachId" INTEGER NOT NULL,
    "pontos" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CoachRoundStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoundScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" INTEGER NOT NULL,
    "pontos" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserRoundScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Selecao_nome_key" ON "Selecao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlayer_userId_playerId_key" ON "UserPlayer"("userId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCoach_userId_key" ON "UserCoach"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_numero_key" ON "Round"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoundStat_roundId_selecaoId_key" ON "TeamRoundStat"("roundId", "selecaoId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRoundStat_roundId_playerId_key" ON "PlayerRoundStat"("roundId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachRoundStat_roundId_coachId_key" ON "CoachRoundStat"("roundId", "coachId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoundScore_userId_roundId_key" ON "UserRoundScore"("userId", "roundId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_selecaoId_fkey" FOREIGN KEY ("selecaoId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_selecaoId_fkey" FOREIGN KEY ("selecaoId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlayer" ADD CONSTRAINT "UserPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlayer" ADD CONSTRAINT "UserPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoach" ADD CONSTRAINT "UserCoach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoach" ADD CONSTRAINT "UserCoach_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoundStat" ADD CONSTRAINT "TeamRoundStat_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoundStat" ADD CONSTRAINT "TeamRoundStat_selecaoId_fkey" FOREIGN KEY ("selecaoId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRoundStat" ADD CONSTRAINT "PlayerRoundStat_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRoundStat" ADD CONSTRAINT "PlayerRoundStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachRoundStat" ADD CONSTRAINT "CoachRoundStat_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachRoundStat" ADD CONSTRAINT "CoachRoundStat_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoundScore" ADD CONSTRAINT "UserRoundScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoundScore" ADD CONSTRAINT "UserRoundScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
