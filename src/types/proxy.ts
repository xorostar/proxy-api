export interface Proxy {
  ip_address: string;
  port: number;
  code: string;
  country: string;
  anonymity: string;
  google: boolean | null;
  https: boolean;
  requests_per_second?: number;
}

export interface ScrapeResult {
  html: string;
  headers: Record<string, string>;
  statusCode: number;
  proxyUsed: Proxy;
}
