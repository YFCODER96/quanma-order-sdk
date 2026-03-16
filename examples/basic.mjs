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
  });

  const tokenData = await client.getToken();
  console.log("token acquired:", tokenData.token.slice(0, 8) + "...");

  // 获取用户信息
  const user = await client.getUserInfo();
  console.log("user info:", {
    certnum: user.certnum,
    balance: user.balance,
    mailAccount: user.mailAccount,
  });

  // 获取商品列表（仅第一页，每页最多100条）
  const products = await client.getFullProducts({ pageNum: 1 });
  console.log("products count:", products.length);
  if (products[0]) {
    console.log("first product:", {
      id: products[0].id,
      couponName: products[0].couponName,
      price: products[0].getAmount,
    });
  }

  // 获取指定商品详情
  const productDetail = await client.getProductDetail({ id: "2805" });
  console.log("product detail:", productDetail);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
