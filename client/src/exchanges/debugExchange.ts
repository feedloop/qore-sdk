import Wonka from "wonka";
import { ExchangeIO } from "../types";

const debugExchange: ExchangeIO = ops => {
  return Wonka.pipe(
    ops,
    Wonka.tap(op => {
      if (op.type === "teardown") return;
      console.warn("No exchange has handled this operation", op);
    }),
    Wonka.filter<any>(() => false)
  );
};

export default debugExchange;
