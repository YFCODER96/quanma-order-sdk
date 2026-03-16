import { QuanmaApiError, QuanmaHttpError } from "./errors.js";
import type {
  AccountInfo,
  FullProductsRequest,
  IdRequest,
  OrderInfo,
  ProductInfo,
  QuanmaClientOptions,
  QuanmaRequestOptions,
  QuanmaResponse,
  ReceiveOrderRequest,
  ReportOrderRequest,
  TokenData,
} from "./types.js";
import { computeBackoffDelay, signMd5, sleep } from "./utils.js";

export class QuanmaClient {
  private readonly baseUrl: string;
  private readonly channelId: string;
  private readonly devCode: string;
  private readonly secretKey: string;
  private token?: string;
  private readonly timeoutMs: number;
  private readonly autoRefreshToken: boolean;
  private readonly refreshIntervalMs: number;
  private tokenRefreshTimer?: ReturnType<typeof setInterval>;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly retryMaxDelayMs: number;
  private readonly retryOnHttpStatus: Set<number>;
  private readonly retryOnRtnCodes: Set<string>;

  constructor(options: QuanmaClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://czopenapi.quanma51.com";
    this.channelId = options.channelId ?? "OP0002";
    this.devCode = options.devCode;
    this.secretKey = options.secretKey;
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.autoRefreshToken = options.autoRefreshToken ?? false;
    this.refreshIntervalMs = options.refreshIntervalMs ?? 30 * 60 * 1000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 300;
    this.retryMaxDelayMs = options.retryMaxDelayMs ?? 3000;
    this.retryOnHttpStatus = new Set(options.retryOnHttpStatus ?? [408, 429, 500, 502, 503, 504]);
    this.retryOnRtnCodes = new Set(options.retryOnRtnCodes ?? []);

    if (this.autoRefreshToken) {
      this.startTokenAutoRefresh();
    }
  }

  setToken(token: string): void {
    this.token = token;
  }

  getTokenValue(): string | undefined {
    return this.token;
  }

  startTokenAutoRefresh(): void {
    if (this.tokenRefreshTimer) {
      return;
    }

    this.tokenRefreshTimer = setInterval(() => {
      this.getToken().catch(() => {
        // Keep timer alive; caller can also invoke getToken manually for explicit handling.
      });
    }, this.refreshIntervalMs);

    this.getToken().catch(() => {
      // Ignore first refresh failure to avoid throwing inside constructor.
    });

    if (typeof this.tokenRefreshTimer === "object" && "unref" in this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unref();
    }
  }

  stopTokenAutoRefresh(): void {
    if (!this.tokenRefreshTimer) {
      return;
    }
    clearInterval(this.tokenRefreshTimer);
    this.tokenRefreshTimer = undefined;
  }

  async getToken(): Promise<TokenData> {
    const res = await this.request<TokenData>("/api/user-server/user/dev/login", {}, { requiresToken: false });
    if (res.token) {
      this.token = res.token;
    }
    return res;
  }

  async getUserInfo<T extends AccountInfo = AccountInfo>(): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/user/basic/userinfo", {});
  }

  async uploadFile(file: Blob | ArrayBuffer | Uint8Array, filename = "voucher.png"): Promise<string> {
    const formData = new FormData();
    if (file instanceof Blob) {
      formData.append("file", file, filename);
    } else if (file instanceof Uint8Array) {
      const bytes = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
      formData.append("file", new Blob([bytes]), filename);
    } else {
      formData.append("file", new Blob([file]), filename);
    }

    return this.request<string>("/api/user-server/user/common/file/upload", {}, {
      contentType: "multipart/form-data",
      formData,
    });
  }

  async getFullProducts<T extends ProductInfo[] = ProductInfo[]>(payload: FullProductsRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vediocharge/info/get/fullproducts", payload);
  }

  async getProductDetail<T extends ProductInfo = ProductInfo>(payload: IdRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vediocharge/info/get/productdetail", payload);
  }

  async receiveOrder<T extends OrderInfo = OrderInfo>(payload: ReceiveOrderRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vedio/receive", payload);
  }

  async reportOrder<T extends OrderInfo = OrderInfo>(payload: ReportOrderRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vedio/report", payload);
  }

  async updateVoucher<T extends OrderInfo = OrderInfo>(payload: ReportOrderRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vedio/updimg", payload);
  }

  async closeOrder<T extends OrderInfo = OrderInfo>(payload: IdRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vedio/close", payload);
  }

  async getOrderDetail<T extends OrderInfo = OrderInfo>(payload: IdRequest): Promise<T> {
    return this.request<T>("/api/coupons-server/coupons/vedio/get/order/detail", payload);
  }

  private async request<T>(path: string, payload: object, opts?: QuanmaRequestOptions): Promise<T> {
    const bodyJson = JSON.stringify(payload ?? {});
    const requiresToken = opts?.requiresToken ?? true;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const txntime = Date.now().toString();
      const sign = signMd5(bodyJson, this.secretKey, txntime);
      const headers: Record<string, string> = {
        channelid: this.channelId,
        devCode: this.devCode,
        txntime,
        sign,
      };

      if (requiresToken) {
        if (!this.token) {
          if (this.autoRefreshToken) {
            await this.getToken();
          } else {
            throw new Error("Token is required. Call getToken() first or setToken().");
          }
        }
        if (!this.token) {
          throw new Error("Token is required. Failed to obtain token.");
        }
        headers.token = this.token;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        let response: Response;
        if (opts?.contentType === "multipart/form-data") {
          response = await fetch(this.baseUrl + path, {
            method: "POST",
            headers,
            body: opts.formData,
            signal: controller.signal,
          });
        } else {
          headers["Content-Type"] = "application/json;charset=UTF-8";
          response = await fetch(this.baseUrl + path, {
            method: "POST",
            headers,
            body: bodyJson,
            signal: controller.signal,
          });
        }

        if (!response.ok) {
          throw new QuanmaHttpError(response.status, response.statusText);
        }

        const json = (await response.json()) as QuanmaResponse<T>;
        if (!json || typeof json.rtnCode !== "string") {
          throw new Error("Unexpected response format");
        }

        if (json.rtnCode !== "000000") {
          throw new QuanmaApiError(
            `Quanma API error: ${json.rtnCode} ${json.rtnMsg}`,
            json.rtnCode,
            json.rtnMsg,
            json
          );
        }

        return json.rtnData;
      } catch (error) {
        lastError = error;
        if (!this.isRetryableError(error) || attempt >= this.maxRetries) {
          throw error;
        }
        await sleep(computeBackoffDelay(attempt, this.retryBaseDelayMs, this.retryMaxDelayMs));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed");
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof QuanmaHttpError) {
      return this.retryOnHttpStatus.has(error.status);
    }

    if (error instanceof QuanmaApiError) {
      return this.retryOnRtnCodes.has(error.rtnCode);
    }

    if (error instanceof Error) {
      return error.name === "AbortError" || error instanceof TypeError;
    }

    return false;
  }
}
