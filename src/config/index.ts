import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  evolutionApi: {
    url: process.env.EVOLUTION_API_URL || "http://localhost:8080",
    key: process.env.EVOLUTION_API_KEY || "",
    instance: process.env.EVOLUTION_INSTANCE || "civilnobre",
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },
  humanPhone: process.env.HUMAN_PHONE || "",
  dashboardSecret: process.env.DASHBOARD_SECRET || "senha123",
};
