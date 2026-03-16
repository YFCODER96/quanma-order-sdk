import fs from "node:fs/promises";
import { QuanmaClient } from "../dist/index.js";

function mustEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function main() {
  const imagePath = mustEnv("QUANMA_IMAGE_PATH");
  const orderId = Number(mustEnv("QUANMA_ORDER_ID"));

  const client = new QuanmaClient({
    devCode: mustEnv("QUANMA_DEV_CODE"),
    secretKey: mustEnv("QUANMA_SECRET_KEY"),
    channelId: process.env.QUANMA_CHANNEL_ID || "OP0002",
  });

  await client.getToken();

  const fileBuffer = await fs.readFile(imagePath);
  const imageUrl = await client.uploadFile(fileBuffer, "voucher.jpg");
  console.log("uploaded image url:", imageUrl);

  const result = await client.updateVoucher({
    id: orderId,
    imgUrlArray: [imageUrl],
  });
  console.log("updated order:", { id: result.id, status: result.getStatus });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
