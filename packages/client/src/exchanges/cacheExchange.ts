import { AxiosRequestConfig } from "axios";
import * as Wonka from "wonka";
import { Exchange, QoreOperation, QoreOperationResult } from "../types";

const cachedOperations = new Set<QoreOperation["type"]>(["GET", "get"]);

const shouldCacheOperation = (operation: QoreOperation) => {
  if (
    cachedOperations.has(operation.type) &&
    operation.networkPolicy !== "network-only"
  ) {
    return true;
  }
  return false;
};

const cacheExchange: Exchange = ({ forward, client }) => operationStream => {
  const resultCache = new Map<string, QoreOperationResult["data"]>();
  const sharedOpsStream = Wonka.share(operationStream);
  const hasCache = (operation: QoreOperation) => {
    return shouldCacheOperation(operation) && resultCache.has(operation.key);
  };
  const cachedStream = Wonka.pipe(
    sharedOpsStream,
    Wonka.filter(
      operation => hasCache(operation) || !!operation.optimisticResponse
    ),
    Wonka.map(
      (operation): QoreOperationResult => {
        const cached = resultCache.get(operation.key);
        const optimisticResponse = operation.optimisticResponse;
        const merged = { ...(cached || {}), ...(optimisticResponse || {}) };

        const result: QoreOperationResult = {
          operation,
          stale: false,
          data: cached || optimisticResponse ? merged : undefined
        };
        // send revalidation command
        if (operation.networkPolicy === "network-and-cache") {
          client.nextOperation({ ...operation, networkPolicy: "network-only" });
          result.stale = true;
        }
        result.operation.meta["cacheHit"] = true;
        result.operation.meta["optimistic"] = !!optimisticResponse;
        return result;
      }
    )
  );

  const forwardStream = Wonka.pipe(
    sharedOpsStream,
    Wonka.filter(operation => !hasCache(operation)),
    forward,
    Wonka.tap(result => {
      if (result.data) {
        result.operation.meta["cacheHit"] = false;
        resultCache.set(result.operation.key, result.data);
      }
    })
  );

  return Wonka.merge([cachedStream, forwardStream]);
};

export default cacheExchange;
