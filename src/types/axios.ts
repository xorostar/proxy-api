import { AxiosRequestConfig } from 'axios';

export interface ProxyAxiosConfig extends AxiosRequestConfig {
  httpsAgent?: any;
  httpAgent?: any;
}
