export interface QuanmaClientOptions {
  baseUrl?: string;
  channelId?: string;
  devCode: string;
  secretKey: string;
  token?: string;
  timeoutMs?: number;
  autoRefreshToken?: boolean;
  refreshIntervalMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  retryOnHttpStatus?: number[];
  retryOnRtnCodes?: string[];
}

export interface QuanmaResponse<T> {
  rtnCode: string;
  rtnMsg: string;
  rtnData: T;
}

export interface TokenData {
  token: string;
  refreshToken: string;
}

export interface ReceiveOrderRequest {
  productId: number;
  callbackUrl: string;
  templateConfigMap: Record<string, unknown>;
}

export interface IdRequest {
  id: number;
}

export interface ReportOrderRequest extends IdRequest {
  imgUrlArray: string[];
}

export interface FullProductsRequest {
  pageNum: number;
}

export interface AccountInfo {
  certnum: string;
  mailAccount: string;
  balance: string;
  forzenbalance: string;
  customerBalance: string;
  customerForzenbalance: string;
  businessBalance: string;
  businessForzenbalance: string;
  [key: string]: unknown;
}

export interface ProductInfo {
  id: number;
  couponName: string;
  couponNameType: string;
  couponNameTypeMemo: string;
  couponSuffixName: string;
  getAmount: number;
  getNote: string;
  getDisableChannel: string;
  needVerifycode: number | boolean;
  num: number;
  [key: string]: unknown;
}

export interface OrderInfo {
  id: number;
  couponName: string;
  couponNameType: string;
  couponNameTypeMemo: string;
  couponSuffixName: string;
  img?: string;
  chargeAccount: string;
  imgPathArray: string[];
  getAmount: number;
  getStatus: number | string;
  accountNickname: string;
  getAddtime: string;
  getReportlimittime: string;
  getClearTime: string;
  note: string;
  autoConpletTime: string;
  voucherType?: string;
  voucherNickName?: string;
  [key: string]: unknown;
}

export interface QuanmaRequestOptions {
  requiresToken?: boolean;
  contentType?: "application/json" | "multipart/form-data";
  formData?: FormData;
}
