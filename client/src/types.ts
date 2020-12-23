import { AxiosRequestConfig } from "axios";
import Wonka from "wonka";
import QoreClient from "./client/Qore";
import { APIField } from "./sdk/project/field";

export type QoreViewSchema = {
  read: Record<string, any>;
  write: Record<string, any>;
  params: Record<string, any>;
  actions: Record<string, any>;
};

export type RowActions<T extends QoreViewSchema["actions"]> = {
  [K in keyof T]: { trigger: (params: T[K]) => Promise<boolean> };
};

export type QoreSchema = Record<string, QoreViewSchema>;

export type NetworkPolicy = "network-only" | "network-and-cache" | "cache-only";

export type QoreOperationConfig = {
  networkPolicy: NetworkPolicy;
  pollInterval: number;
};

export type QoreProjectSchemaV1 = {
  version: "v1";
  views: Array<{
    id: string;
    name: string;
    tableId: string;
    fields: APIField[];
  }>;
};

export type QoreProjectSchema = QoreProjectSchemaV1;

export type QoreOperation<
  Params extends AxiosRequestConfig = AxiosRequestConfig
> = QoreOperationConfig & {
  request: Params;
  type: Params["method"] | "teardown";
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
  client: QoreClient<{}>;
  forward: ExchangeIO;
}

export type Exchange = (input: ExchangeInput) => ExchangeIO;

export type ExchangeIO = (
  ops$: Wonka.Source<QoreOperation<AxiosRequestConfig>>
) => Wonka.Source<QoreOperationResult<AxiosRequestConfig>>;
