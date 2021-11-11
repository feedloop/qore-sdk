import Axios, { AxiosRequestConfig } from "axios";
import * as Wonka from "wonka";
import QoreClient from "../client/Qore";
import {
  Exchange,
  ExchangeIO,
  QoreOperation,
  QoreOperationResult,
  QoreOperationResultData
} from "../types";

const makeNetworkSource = (
  operation: QoreOperation<AxiosRequestConfig>,
  client: QoreClient
) => {
  return Wonka.make<QoreOperationResult<AxiosRequestConfig>>(
    ({ next, complete }) => {
      const cancelToken = Axios.CancelToken.source();
      const request = client.project.axios.request<
        QoreOperationResultData<QoreOperationResult<AxiosRequestConfig>>
      >({
        ...operation.request,
        cancelToken: cancelToken.token,
        url:
          (client.project.axios.defaults.baseURL || "") + operation.request.url
      });
      request
        .then(resp => {
          next({ data: resp.data, operation, stale: false });
        })
        .catch(error => {
          next({ error: error, operation, stale: false });
        })
        .finally(() => {
          complete();
        });
      return () => {
        cancelToken.cancel();
      };
    }
  );
};

const isTeardown = (operation: QoreOperation) => operation.type === "teardown";

const networkExchange: Exchange =
  ({ forward, client }) =>
  operationStream => {
    const sharedOpsStream = Wonka.share(operationStream);
    const resultsStream = Wonka.pipe(
      sharedOpsStream,
      Wonka.filter(operation => !isTeardown(operation)),
      Wonka.mergeMap(operation => {
        const { key } = operation;
        const teardownStream = Wonka.pipe(
          sharedOpsStream,
          Wonka.filter(op => op.type === "teardown" && op.key === key)
        );

        return Wonka.pipe(
          makeNetworkSource(operation, client),
          Wonka.takeUntil(teardownStream)
        );
      })
    );

    const forwardStream = Wonka.pipe(
      sharedOpsStream,
      Wonka.filter(operation => isTeardown(operation)),
      forward
    );

    return Wonka.merge([resultsStream, forwardStream]);
  };

export default networkExchange;
