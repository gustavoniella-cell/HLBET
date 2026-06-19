-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "selecaoAId" INTEGER NOT NULL,
    "selecaoBId" INTEGER NOT NULL,
    "horario" TEXT,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_selecaoAId_fkey" FOREIGN KEY ("selecaoAId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_selecaoBId_fkey" FOREIGN KEY ("selecaoBId") REFERENCES "Selecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
