import { QuanmaClient } from "../dist/index.js";

function mustEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function main() {
  const productId = Number(mustEnv("QUANMA_PRODUCT_ID"));
  const callbackUrl = mustEnv("QUANMA_CALLBACK_URL");

  const client = new QuanmaClient({
    devCode: mustEnv("QUANMA_DEV_CODE"),
    secretKey: mustEnv("QUANMA_SECRET_KEY"),
    channelId: process.env.QUANMA_CHANNEL_ID || "OP0002",
  });

  await client.getToken();

  const order = await client.receiveOrder({
    productId,
    callbackUrl,
    templateConfigMap: {},
  });
  console.log("received order:", { id: order.id, status: order.getStatus });

  const detail = await client.getOrderDetail({ id: order.id });
  console.log("order detail:", { id: detail.id, account: detail.chargeAccount });

  // If needed, close the order:
  // const closed = await client.closeOrder({ id: order.id });
  // console.log("closed:", closed.id);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
