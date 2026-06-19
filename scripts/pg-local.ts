import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const pg = new EmbeddedPostgres({
  databaseDir: "./.pg-data",
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

async function main() {
  const fresh = !existsSync("./.pg-data");
  if (fresh) await pg.initialise();
  await pg.start();
  console.log(
    "PG READY: postgresql://postgres:postgres@localhost:5433/postgres"
  );
  const stop = async () => {
    try {
      await pg.stop();
    } catch {}
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  await new Promise(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
