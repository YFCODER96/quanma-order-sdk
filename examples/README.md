# Examples

These examples run against built output in `../dist/index.js`.

## Prepare

1. Build once:

```bash
npm run build
```

2. Set environment variables (PowerShell):

```powershell
$env:QUANMA_DEV_CODE="your-dev-code"
$env:QUANMA_SECRET_KEY="your-secret-key"
$env:QUANMA_CHANNEL_ID="OP0002"
```

## Run

- Basic flow:

```bash
node examples/basic.mjs
```

- Auto token refresh:

```bash
node examples/auto-refresh.mjs
```

- Receive and query order:

```powershell
$env:QUANMA_PRODUCT_ID="554"
$env:QUANMA_CALLBACK_URL="https://your-callback.example.com/quanma"
node examples/order-flow.mjs
```

- Upload voucher and update order:

```powershell
$env:QUANMA_IMAGE_PATH="C:\\path\\to\\voucher.jpg"
$env:QUANMA_ORDER_ID="50550"
node examples/upload-voucher.mjs
```
