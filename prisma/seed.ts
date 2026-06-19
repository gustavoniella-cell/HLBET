import "dotenv/config";
import { importGameData } from "../src/lib/importGame";

importGameData({ force: true })
  .then((r) => {
    console.log("Seed OK:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
