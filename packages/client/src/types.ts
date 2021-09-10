import { AxiosRequestConfig } from "axios";
import * as Wonka from "wonka";
import QoreClient from "./client/Qore";
import { FormDriver } from "./client";

export type QoreViewSchema = {
  read: Record<string, any>;
  write: Record<string, any>;
  params: Record<string, any>;
  actions: Record<string, any>;
  forms: Record<string, Record<string, any>>;
};

export type RowActions<T extends QoreViewSchema["actions"]> = {
  [K in keyof T]: {
    trigger: (rowId: string, params: T[K]) => Promise<boolean>;
  };
};

export type FormDrivers<T extends QoreViewSchema["forms"]> = {
  [K in keyof T]: FormDriver<T[K]>;
};

export type QoreSchema = Record<string, QoreViewSchema>;

export type NetworkPolicy = "network-only" | "network-and-cache" | "cache-only";

export type OptimisticResponse = Record<string, any>;

export declare type QoreOperationConfig<T extends OptimisticResponse = {}> = {
  networkPolicy: NetworkPolicy;
  pollInterval: number;
  optimisticResponse?: T;
  optimisticStrategy?: "cache-first" | "optimistic-first";
  mode?: "Sync" | "default";
};

export type QoreOperation<
  TParams extends AxiosRequestConfig = AxiosRequestConfig,
  TOpimisticResponse extends OptimisticResponse = {}
> = QoreOperationConfig<TOpimisticResponse> & {
  request: TParams;
  type: TParams["method"] | "teardown";
  key: string;
  meta: Record<string, any>;
};

export type QoreOperationResultData<T> = T extends QoreOperationResult<
  AxiosRequestConfig,
  infer U
>
  ? U
  : never;

export type QoreOperationResult<Params = AxiosRequestConfig, Data = any> = {
  operation: QoreOperation<Params>;
  data?: Data;
  error?: Error;
  stale: boolean;
};

/** Input parameters for to an Exchange factory function. */
export interface ExchangeInput {
  client: QoreClient<QoreSchema>;
  forward: ExchangeIO;
}

export type Exchange = (input: ExchangeInput) => ExchangeIO;

export type ExchangeIO = (
  ops$: Wonka.Source<QoreOperation<AxiosRequestConfig>>
) => Wonka.Source<QoreOperationResult<AxiosRequestConfig>>;
