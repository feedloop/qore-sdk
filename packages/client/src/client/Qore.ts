import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as Wonka from "wonka";
import {
  Exchange,
  ExchangeInput,
  QoreOperation,
  QoreOperationConfig,
  QoreOperationResult,
  QoreSchema
} from "../types";
import debugExchange from "../exchanges/debugExchange";
import networkExchange from "../exchanges/networkExchange";
import { ViewDriver } from "./ViewDriver";
import cacheExchange from "../exchanges/cacheExchange";
import dedupeExchange from "../exchanges/dedupeExchange";
import { QoreProjectSchema } from "@feedloop/qore-sdk";

export type RelationValue = { id: string } | Array<{ id: string }>;

export type QoreRow = { id: string } & Record<
  string,
  string | number | boolean | RelationValue
>;

export type QoreConfig = {
  endpoint: string;
  projectId: string;
  organizationId: string;
  authenticationId?: string;
  getToken?: () => Promise<string | undefined> | string | undefined;
  onError?: (error: Error) => void;
};

export const defaultOperationConfig: QoreOperationConfig = {
  networkPolicy: "network-and-cache",
  pollInterval: 0
};

export class QoreProject {
  config: QoreConfig;
  axios: AxiosInstance;
  constructor(config: QoreConfig) {
    this.config = config;
    this.axios = Axios.create({
      baseURL: `${config.endpoint || "http://localhost:8080"}/${
        this.config.projectId
      }`
    });
    this.axios.interceptors.request.use(async req => {
      const getTokenResult = this.config.getToken && this.config.getToken();
      let token: string | undefined;
      if (typeof token !== "string" && typeof token !== "undefined") {
        token = await getTokenResult;
      } else if (typeof getTokenResult === "string") {
        token = getTokenResult;
      }
      if (typeof token === "string") {
        req.headers["Authorization"] = `Bearer ${token}`;
      }
      return req;
    });
    this.axios.interceptors.response.use(
      async function handleSuccess(resp) {
        return resp;
      },
      async error => {
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
  forward
}: ExchangeInput) =>
  exchanges.reduceRight(
    (forward, exchange) =>
      exchange({
        client,
        forward
      }),
    forward
  );

export type PromisifiedSource<
  T extends QoreOperationResult
> = Wonka.Source<T> & {
  toPromise: () => Promise<T>;
  revalidate: (config?: Partial<QoreOperationConfig>) => Promise<T>;
  subscribe: (callback: (data: T) => void) => Wonka.Subscription;
};

export function withHelpers<T extends QoreOperationResult>(
  source$: Wonka.Source<T>,
  client: QoreClient,
  operation: QoreOperation
): PromisifiedSource<T> {
  (source$ as PromisifiedSource<T>).toPromise = () =>
    Wonka.pipe(source$, Wonka.take(1), Wonka.toPromise);
  (source$ as PromisifiedSource<T>).subscribe = callback =>
    Wonka.subscribe(callback)(source$);
  (source$ as PromisifiedSource<T>).revalidate = async (
    config = defaultOperationConfig
  ): Promise<T> => {
    // @ts-ignore
    return client
      .execute<T>({
        ...defaultOperationConfig,
        ...operation,
        networkPolicy: "network-only",
        ...config
      })
      .toPromise();
  };

  return source$ as PromisifiedSource<T>;
}

export default class QoreClient<T extends QoreSchema = QoreSchema> {
  results: Wonka.Source<QoreOperationResult<AxiosRequestConfig>>;
  operations: Wonka.Source<QoreOperation<AxiosRequestConfig>>;
  nextOperation: (operation: QoreOperation<AxiosRequestConfig>) => void;
  activeOperations: Record<string, number> = {};
  project: QoreProject;
  views: { [K in keyof T]: ViewDriver<T[K]> };
  constructor(config: QoreConfig) {
    this.project = new QoreProject(config);
    const { next, source } = Wonka.makeSubject<
      QoreOperation<AxiosRequestConfig>
    >();
    this.operations = source;
    this.nextOperation = next;
    const composedExchange = composeExchanges([
      cacheExchange,
      dedupeExchange,
      networkExchange
    ]);

    this.results = Wonka.share(
      composedExchange({ client: this, forward: debugExchange })(
        this.operations
      )
    );
    this.views = new Proxy({} as { [K in keyof T]: ViewDriver<T[K]> }, {
      get: (views, key: string): ViewDriver<T[string]> => {
        if (!views[key]) {
          const currentView: ViewDriver<T[string]> = new ViewDriver<T[string]>(
            this,
            this.project,
            key,
            "UNKNOWN",
            []
          );
          // @ts-ignore
          views[key] = currentView;
        }
        return views[key];
      }
    });
    // Keep the stream open
    Wonka.publish(this.results);
  }
  view<K extends keyof T>(viewId: K): ViewDriver<T[K]> {
    if (!this.views[viewId]) {
      const currentView: ViewDriver<T[K]> = new ViewDriver<T[K]>(
        this,
        this.project,
        viewId as string,
        "UNKNOWN",
        []
      );
      this.views[viewId] = currentView;
    }
    return this.views[viewId];
  }
  init(schema: QoreProjectSchema) {
    const views = schema.views.map(view => {
      return new ViewDriver(
        this,
        this.project,
        view.id,
        view.tableId,
        view.fields
      );
    });
    for (const view of views) {
      // @ts-ignore
      this.views[view.id] = view;
    }
  }
  async currentUser(): Promise<any> {
    const currentUser = await this.project.axios.get("/me");
    return currentUser.data;
  }
  async authenticate(email: string, password: string): Promise<string> {
    const config: AxiosRequestConfig = {
      baseURL: this.project.config.endpoint,
      url: `/project-authenticate/${this.project.config.projectId}`,
      method: "post",
      headers: {
        "X-Qore-Authentication": this.project.config.authenticationId
      },
      data: { identifier: email, password }
    };
    const resp = await this.project.axios.request<{
      email: string;
      token: string;
    }>(config);
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
      Wonka.filter(result => result.operation.key === operation.key)
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
      Wonka.filter(op => op.key === operation.key && op.type === "teardown")
    );

    resultStream = Wonka.pipe(
      resultStream,
      Wonka.takeUntil(teardownStream),
      Wonka.onStart(() => this.onOperationStart(operation)),
      Wonka.onEnd(() => this.onOperationEnd(operation))
    );

    if (operation.pollInterval > 0) {
      return Wonka.pipe(
        Wonka.merge([
          Wonka.fromValue(0),
          Wonka.interval(operation.pollInterval)
        ]),
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
