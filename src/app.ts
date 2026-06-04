import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";
import { db } from "./database/client";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

async function main() {
  await db.$connect();
  console.log("✅ Banco de dados conectado");

  app.listen(config.port, () => {
    console.log(`🚀 Civilnobre CRM rodando na porta ${config.port}`);
    console.log(`📱 Webhook: http://SEU_IP:${config.port}/webhook`);
    console.log(`📊 Stats:   http://SEU_IP:${config.port}/stats?key=SUA_SENHA`);
    console.log(`👥 Leads:   http://SEU_IP:${config.port}/leads?key=SUA_SENHA`);
  });
}

main().catch((e) => {
  console.error("Erro ao iniciar:", e);
  process.exit(1);
});
