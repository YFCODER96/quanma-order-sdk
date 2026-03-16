import { QuanmaClient } from "../dist/index.js";

function mustEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function main() {
  const client = new QuanmaClient({
    devCode: mustEnv("QUANMA_DEV_CODE"),
    secretKey: mustEnv("QUANMA_SECRET_KEY"),
    channelId: process.env.QUANMA_CHANNEL_ID || "OP0002",
    autoRefreshToken: true,
    refreshIntervalMs: 30 * 60 * 1000,
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("current token:", client.getTokenValue()?.slice(0, 8) + "...");

  const user = await client.getUserInfo();
  console.log("balance:", user.balance);

  client.stopTokenAutoRefresh();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
