import type { QuanmaResponse } from "./types.js";

export class QuanmaApiError<T = unknown> extends Error {
  public readonly rtnCode: string;
  public readonly rtnMsg: string;
  public readonly raw?: QuanmaResponse<T>;

  constructor(message: string, rtnCode: string, rtnMsg: string, raw?: QuanmaResponse<T>) {
    super(message);
    this.name = "QuanmaApiError";
    this.rtnCode = rtnCode;
    this.rtnMsg = rtnMsg;
    this.raw = raw;
  }
}

export class QuanmaHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "QuanmaHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}
