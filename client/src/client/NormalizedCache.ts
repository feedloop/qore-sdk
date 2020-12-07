import produce from "immer";
import { ViewDriver } from './ViewDriver';
import { CacheRef, ViewDriverObject, QoreRow } from './Qore';

// for future reference if normalized cache is necessary
export class NormalizedCache {
  data: Record<
    string,
    Record<string, boolean | number | string | CacheRef>
  > = {};
  modify(modifier: (data: NormalizedCache["data"]) => void) {
    this.data = produce(this.data, modifier);
  }
  identify(table: string, id: string) {
    return `${table}:${id}`;
  }
  lookup(ref: CacheRef, depth = 0): Record<string, any> {
    const record: Record<string, any> = {};
    const [table, id] = ref.__ref.split(":");
    const cacheKey = this.identify(table, id);
    const cache = this.data[cacheKey];
    for (const [key, value] of Object.entries(cache)) {
      record[key] =
        typeof value !== "object"
          ? value
          : depth > 0
            ? this.lookup(value, depth - 1)
            : undefined;
    }
    return record;
  }
  read<V extends ViewDriver>(view: V, id: string): ViewDriverObject<V> {
    return this.lookup(
      { __ref: this.identify(view.tableId, id) },
      1
    ) as ViewDriverObject<V>;
  }
  write<V extends ViewDriver, T extends QoreRow>(view: V, rows: T[]) {
    for (const row of rows) {
      const id = this.identify(view.tableId, row.id);
      for (const field of Object.values(view.fields)) {
        if (typeof row === "object")
          return;
        this.modify((draft) => {
          draft[id][field.id] = row[field.id];
        });
      }
    }
  }
}
