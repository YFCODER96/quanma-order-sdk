# Quanma API SDK (TypeScript)

基于券码无忧接单 API 文档封装，包含以下能力：

- 自动拼接公共请求头（`channelid`、`devCode`、`txntime`、`sign`、`token`）
- 自动签名：`MD5(bodyjson + key + txntime)`
- 对接口返回统一处理：仅 `rtnCode = 000000` 视为成功
- 已封装文档中的 10 个接口
- 支持自动续 token（可选）

## 安装

```bash
npm install quanma-sdk
```

## 示例

- 可运行示例见 `examples` 目录：`basic.mjs`、`auto-refresh.mjs`、`order-flow.mjs`、`upload-voucher.mjs`
- 运行说明见 `examples/README.md`

## 快速开始

```ts
import { QuanmaClient } from "quanma-sdk";

const client = new QuanmaClient({
  devCode: "你的devCode",
  secretKey: "平台分配的私钥",
  channelId: "OP0002", // 默认就是 OP0002，可不填
  autoRefreshToken: true, // 可选：自动定时刷新 token
  refreshIntervalMs: 30 * 60 * 1000, // 可选：默认 30 分钟
  maxRetries: 2, // 可选：默认 2（总请求次数=1+重试次数）
  retryBaseDelayMs: 300, // 可选：默认 300ms
  retryMaxDelayMs: 3000, // 可选：默认 3000ms
  retryOnHttpStatus: [408, 429, 500, 502, 503, 504], // 可选
  retryOnRtnCodes: [], // 可选：需要按业务码重试时填写
});

async function main() {
  // 1) 获取 token（默认会自动写入 client 内部）
  const login = await client.getToken();
  console.log("token=", login.token);

  // 2) 查询账号信息
  const user = await client.getUserInfo();
  console.log(user);

  // 3) 产品分页
  const products = await client.getFullProducts({ pageNum: 1 });
  console.log(products);
}

main().catch(console.error);
```

## 自动续 token

- `autoRefreshToken: true` 时，客户端会在初始化后立即尝试获取 token，并按 `refreshIntervalMs` 周期续期。
- 你也可以手动控制：

```ts
client.startTokenAutoRefresh();
client.stopTokenAutoRefresh();
```

## 重试与退避

- 默认对网络超时、网络错误和 `408/429/5xx` 做重试。
- 退避策略为指数退避：`retryBaseDelayMs * 2^attempt`，上限 `retryMaxDelayMs`。
- 你可以通过 `retryOnRtnCodes` 指定业务错误码重试（例如某些可恢复状态）。

## 类型化返回

SDK 默认返回强类型（例如 `AccountInfo`、`ProductInfo`、`OrderInfo`）：

```ts
import { QuanmaClient, type ProductInfo } from "quanma-sdk";

const client = new QuanmaClient({
  devCode: "你的devCode",
  secretKey: "平台私钥",
});

const products = await client.getFullProducts({ pageNum: 1 });
const first: ProductInfo | undefined = products[0];
console.log(first?.couponName);
```

## 已封装接口

- `getToken()` -> `/api/user-server/user/dev/login`
- `getUserInfo()` -> `/api/coupons-server/coupons/user/basic/userinfo`
- `uploadFile(file)` -> `/api/user-server/user/common/file/upload`
- `getFullProducts({ pageNum })` -> `/api/coupons-server/coupons/vediocharge/info/get/fullproducts`
- `getProductDetail({ id })` -> `/api/coupons-server/coupons/vediocharge/info/get/productdetail`
- `receiveOrder({ productId, callbackUrl, templateConfigMap })` -> `/api/coupons-server/coupons/vedio/receive`
- `reportOrder({ id, imgUrlArray })` -> `/api/coupons-server/coupons/vedio/report`
- `updateVoucher({ id, imgUrlArray })` -> `/api/coupons-server/coupons/vedio/updimg`
- `closeOrder({ id })` -> `/api/coupons-server/coupons/vedio/close`
- `getOrderDetail({ id })` -> `/api/coupons-server/coupons/vedio/get/order/detail`

## 注意

- 签名计算使用 UTF-8 字符串。
- 当 JSON body 为空时，签名按 `{}` 参与计算。
- `uploadFile` 为 `multipart/form-data`，签名仍按 `{}` 计算。
- 接口返回非 `000000` 时会抛出 `QuanmaApiError`。
- 运行环境需 Node.js 18+（依赖原生 `fetch`、`FormData`、`Blob`）。
