import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import Wonka, { merge } from "wonka";
import { schema, Schema, SchemaObject } from "normalizr";
import { Field } from "../sdk/project/field";
import {
  Exchange,
  ExchangeInput,
  ExchangeIO,
  QoreOperation,
  QoreOperationConfig,
  QoreOperationResult,
} from "../types";
import debugExchange from "../exchanges/debugExchange";
import networkExchange from "../exchanges/networkExchange";
import { ViewDriver } from "./ViewDriver";
import { NormalizedCache } from "./NormalizedCache";
import cacheExchange from "../exchanges/cacheExchange";

export type RelationValue = { id: string } | Array<{ id: string }>;

export type QoreRow = { id: string } & Record<
  string,
  string | number | boolean | RelationValue
>;

type QoreConfig = {
  projectId: string;
  organisationId: string;
  getToken?: () => string | undefined;
  onError?: (error: Error) => void;
};

export const defaultOperationConfig: QoreOperationConfig = {
  networkPolicy: "network-and-cache",
  pollInterval: 0,
};

export class QoreProject {
  config: QoreConfig;
  axios: AxiosInstance;
  constructor(config: QoreConfig) {
    this.config = config;
    this.axios = Axios.create({
      baseURL: `${process.env.QORE_API || "http://localhost:8080"}/orgs/${
        this.config.organisationId
      }/projects/${this.config.projectId}`,
    });
    this.axios.interceptors.request.use((req) => {
      const token = this.config.getToken && this.config.getToken();
      if (token) req.headers["Authorization"] = `Bearer ${token}`;
      return req;
    });
    this.axios.interceptors.response.use(
      async function handleSuccess(resp) {
        return resp;
      },
      async (error) => {
        this.config.onError && this.config.onError(error);
        throw error;
      }
    );
  }
}

export type OperationResult<T> = {
  loading: boolean;
  data?: T;
  error?: Error;
};
export type ViewDriverObject<T> = T extends ViewDriver<infer U> ? U : never;

export type CacheRef = { __ref: string };

export const composeExchanges = (exchanges: Exchange[]) => ({
  client,
  forward,
}: ExchangeInput) =>
  exchanges.reduceRight(
    (forward, exchange) =>
      exchange({
        client,
        forward,
      }),
    forward
  );

export type PromisifiedSource<T = any> = Wonka.Source<T> & {
  toPromise: () => Promise<T>;
  revalidate: (config?: Partial<QoreOperationConfig>) => void;
  subscribe: (callback: (data: T) => void) => Wonka.Subscription;
};

export function withHelpers<T>(
  source$: Wonka.Source<T>,
  client: QoreClient,
  operation: QoreOperation
): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () =>
    Wonka.pipe(source$, Wonka.take(1), Wonka.toPromise);

  (source$ as PromisifiedSource<T>).subscribe = (callback) =>
    Wonka.subscribe(callback)(source$);

  (source$ as PromisifiedSource<T>).revalidate = (
    config = defaultOperationConfig
  ) => {
    client.revalidate({ ...defaultOperationConfig, ...operation, ...config });
  };

  return source$ as PromisifiedSource<T>;
}

export default class QoreClient<T extends Record<string, any> = {}> {
  results: Wonka.Source<QoreOperationResult<AxiosRequestConfig>>;
  operations: Wonka.Source<QoreOperation<AxiosRequestConfig>>;
  nextOperation: (operation: QoreOperation<AxiosRequestConfig>) => void;
  activeOperations: Record<string, number> = {};
  project: QoreProject;
  // @ts-ignore
  views: { [K in keyof T]: ViewDriver<T[K]> } = {};
  constructor(config: QoreConfig) {
    this.project = new QoreProject(config);
    const { next, source } = Wonka.makeSubject<
      QoreOperation<AxiosRequestConfig>
    >();
    this.operations = source;
    this.nextOperation = next;
    const composedExchange = composeExchanges([cacheExchange, networkExchange]);

    this.results = Wonka.share(
      composedExchange({ client: this, forward: debugExchange })(
        this.operations
      )
    );
    // Keep the stream open
    Wonka.publish(this.results);
  }
  async init() {
    const resp = await this.project.axios.get<{
      nodes: Array<{ id: string; name: string; tableId: string }>;
    }>("/views");
    const views = await Promise.all(
      resp.data.nodes.map(async (view) => {
        const resp = await this.project.axios.get<{ nodes: Field[] }>(
          `/views/${view.id}/fields`
        );
        return new ViewDriver(
          this,
          this.project,
          view.id,
          view.tableId,
          resp.data.nodes
        );
      })
    );
    // @ts-ignore
    this.views = views.reduce(
      (map, driver) => ({
        ...map,
        [driver.id]: driver,
      }),
      {}
    );
  }
  async authenticate(email: string, password: string): Promise<string> {
    const resp = await this.project.axios.post<{
      email: string;
      token: string;
    }>("/login", { email, password });
    return resp.data.token;
  }
  onOperationStart(operation: QoreOperation) {
    this.activeOperations[operation.key] =
      (this.activeOperations[operation.key] || 0) + 1;
    this.nextOperation(operation);
  }
  onOperationEnd(operation: QoreOperation) {
    this.activeOperations[operation.key] =
      (this.activeOperations[operation.key] || 0) - 1;
    // send teardown command when there are no subscribers anymore
    if (this.activeOperations[operation.key] < 1) {
      this.nextOperation({ ...operation, type: "teardown" });
    }
  }
  revalidate(operation: QoreOperation) {
    if ((this.activeOperations[operation.key] || 0) > 0) {
      this.nextOperation(operation);
    }
  }
  executeOperation(operation: QoreOperation) {
    let resultStream = Wonka.pipe(
      this.results,
      Wonka.filter((result) => result.operation.key === operation.key)
    );
    // non GET operations should receive only one result
    if (operation.type?.toLowerCase() !== "get") {
      return Wonka.pipe(
        resultStream,
        Wonka.onStart(() => this.nextOperation(operation)),
        Wonka.take(1)
      );
    }

    const teardownStream = Wonka.pipe(
      this.operations,
      Wonka.filter((op) => op.key === operation.key && op.type === "teardown")
    );

    resultStream = Wonka.pipe(
      resultStream,
      Wonka.takeUntil(teardownStream),
      Wonka.onStart(() => this.onOperationStart(operation)),
      Wonka.onEnd(() => this.onOperationEnd(operation))
    );

    if (operation.pollInterval > 0) {
      return Wonka.pipe(
        merge([Wonka.fromValue(0), Wonka.interval(operation.pollInterval)]),
        Wonka.switchMap(() => resultStream)
      );
    }
    return resultStream;
  }
  execute<Data = any>(
    operation: QoreOperation
  ): PromisifiedSource<QoreOperationResult<AxiosRequestConfig, Data>> {
    return withHelpers(this.executeOperation(operation), this, operation);
  }
}
