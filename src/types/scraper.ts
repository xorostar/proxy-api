export interface ScrapeRequest {
  url: string;
}

export interface ScrapeResponse {
  html: string;
  headers: Record<string, string>;
  statusCode: number;
  proxy: {
    ip: string;
    port: number;
    country: string;
    anonymity: string;
    https: boolean;
  };
}
