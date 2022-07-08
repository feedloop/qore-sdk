import { AxiosRequestConfig } from "axios";
import { map, pipe } from "wonka";
import {
  QoreOperation,
  QoreOperationConfig,
  QoreOperationResult,
  QoreViewSchema
} from "../types";
import QoreClient, {
  defaultOperationConfig,
  PromisifiedSource,
  QoreProject
} from "./Qore";

export class InsightDriver<T extends QoreViewSchema = QoreViewSchema> {
  insightId: string;
  project: QoreProject;
  client: QoreClient;

  constructor(client: QoreClient, project: QoreProject, insightId: string) {
    this.client = client;
    this.project = project;
    this.insightId = insightId;
  }

  readRows(
    opts: Partial<{
      start: string;
      end: string;
      params: Record<string, any>;
    }>,
    config: Partial<QoreOperationConfig> = defaultOperationConfig
  ): PromisifiedSource<
    QoreOperationResult<AxiosRequestConfig, { nodes: T["read"][] }>
  > {
    const axiosConfig: AxiosRequestConfig = {
      url: `/v1/execute`,
      method: "POST",
      data: {
        operations: [
          {
            operation: "Insight",
            instruction: {
              name: "insight",
              insight: this.insightId,
              start: opts.start,
              end: opts.end,
              params: opts.params
            }
          }
        ]
      }
    };
    const operation: QoreOperation = {
      key: JSON.stringify(axiosConfig),
      request: axiosConfig,
      type: axiosConfig.method,
      meta: {},
      mode: "subscription",
      ...{ ...defaultOperationConfig, ...config }
    };
    const stream = this.client.execute(operation, resultStream =>
      pipe(
        resultStream,
        map(result => ({
          ...result,
          data: {
            nodes: result.data?.results.insight || []
          }
        }))
      )
    );

    return stream;
  }
}
