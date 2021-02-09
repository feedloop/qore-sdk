import * as Wonka from "wonka";
import { Exchange } from "../types";

const exportExchange: Exchange = ({ forward }) => operationStream => {
  const ongoingOps = new Set<string>();
  return Wonka.pipe(
    operationStream,
    Wonka.filter(op => {
      if (op.type?.toLowerCase() !== "get") return true;
      if (ongoingOps.has(op.key)) return false;
      ongoingOps.add(op.key);
      return true;
    }),
    forward,
    Wonka.tap(result => {
      if (ongoingOps.has(result.operation.key)) {
        ongoingOps.delete(result.operation.key);
      }
    })
  );
};

export default exportExchange;
