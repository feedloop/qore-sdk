import React from "react";
import {
  QoreSchema,
  QoreClient,
  QoreOperationConfig,
  RowActions,
  QoreViewSchema,
  QoreOperationResult,
  PromisifiedSource
} from "@qorebase/client";
import { AxiosRequestConfig } from "axios";
import { ConditionalPick } from "type-fest";
import stableHash from "stable-hash";

type QoreRequestStatus = "idle" | "loading" | "success" | "error";
type RelationActions = "addRelation" | "removeRelation";

function interceptPromise<T = any>(
  p: Promise<T>,
  handleResponse: (res: T) => void,
  handleError: (e: Error) => void
): Promise<T> {
  p.then(resp => {
    handleResponse(resp);
    return resp;
  })
    .catch(err => {
      handleError(err);
      throw err;
    })
    .finally(() => {});
  return p;
}

export declare type RowActionsHooks<T extends QoreViewSchema["actions"]> = {
  [K in keyof T]: {
    trigger: (params: T[K]) => Promise<boolean>;
  };
};

type InsightHooks<T extends QoreSchema[string]> = {
  useListRow: (opts?: {
    start?: string;
    end?: string;
  }) => {
    data: T["read"][];
    status: QoreRequestStatus;
    error: Error | null;
    fetchMore(fetchMoreOpts: typeof opts): Promise<void>;
    revalidate: (
      config?: Partial<QoreOperationConfig>
    ) => Promise<QoreOperationResult<AxiosRequestConfig, T["read"][]>>;
  };
};

type QoreHooks<T extends QoreSchema[string]> = {
  useListRow: (
    opts?: Partial<{
      limit: number;
      offset: number;
      order: "asc" | "desc";
      orderBy: Record<string, "ASC" | "DESC">;
      condition: Record<string, any>;
      populate: Array<string>;
    }> &
      T["params"],
    config?: Partial<QoreOperationConfig>
  ) => {
    data: T["read"][];
    status: QoreRequestStatus;
    error: Error | null;
    fetchMore(fetchMoreOpts: typeof opts): Promise<void>;
    revalidate: (
      config?: Partial<QoreOperationConfig>
    ) => Promise<QoreOperationResult<AxiosRequestConfig, T["read"][]>>;
  };

  useGetRow: (
    rowId: string,
    config?: Partial<QoreOperationConfig>
  ) => {
    data: T["read"] | null;
    status: QoreRequestStatus;
    error: Error | null;
    revalidate: (
      config?: Partial<QoreOperationConfig>
    ) => Promise<QoreOperationResult<AxiosRequestConfig, T["read"]>>;
  };

  useInsertRow: () => {
    insertRow: (
      data: Partial<T["write"]>,
      config?: Partial<QoreOperationConfig>
    ) => Promise<T["read"] | undefined>;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useUpdateRow: () => {
    updateRow: (
      rowId: string,
      data: Partial<T["write"]>,
      config?: Partial<QoreOperationConfig>
    ) => Promise<T["read"] | undefined>;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useDeleteRow: () => {
    deleteRow: (
      rowId: string,
      config?: Partial<QoreOperationConfig>,
      params?: T["params"],
    ) => Promise<boolean | undefined>;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useActions: (
    rowId: string
  ) => {
    action: <A extends keyof RowActionsHooks<T["actions"]>>(
      actionId: A
    ) => RowActionsHooks<T["actions"]>[A];
    rowActions: RowActionsHooks<T["actions"]>;
    statuses: Record<keyof RowActions<T["actions"]>, QoreRequestStatus>;
    errors: Record<keyof RowActions<T["actions"]>, Error | null>;
  };

  useRelation: (
    rowId: string
  ) => {
    statuses: Record<RelationActions, QoreRequestStatus>;
    errors: Record<RelationActions, Error | null>;
  } & Record<
    RelationActions,
    (
      relations: Partial<ConditionalPick<T["write"], string[]>>
    ) => Promise<boolean>
  >;
};

type QoreContextViews<ProjectSchema extends QoreSchema> = {
  [ViewName in keyof ProjectSchema]: QoreHooks<ProjectSchema[ViewName]>;
};

type QoreContextInsights<ProjectSchema extends QoreSchema> = {
  [InsightName in keyof ProjectSchema]: InsightHooks<
    ProjectSchema[InsightName]
  >;
};

const createQoreContext = <ProjectSchema extends QoreSchema>(
  client: QoreClient<ProjectSchema>
) => {
  const context = React.createContext<{
    client: QoreClient<ProjectSchema>;
  }>({ client });

  const useCurrentUser = (deps: any[] = []) => {
    const qoreClient = useClient();
    const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
    const [error, setError] = React.useState<Error | null>(null);
    const [user, setUser] = React.useState<Record<string, any> | null>(null);
    React.useEffect(() => {
      (async () => {
        setStatus("loading");
        try {
          const user = await qoreClient.currentUser();
          setUser(user);
          setStatus("success");
        } catch (error: any) {
          setUser(null);
          setError(error);
          setStatus("error");
        }
      })();
    }, deps);
    return { status, error, user };
  };

  function createViewHooks<K extends keyof ProjectSchema>(
    currentViewId: K,
    isTable = false
  ): QoreHooks<ProjectSchema[K]> {
    const rowActions = {} as RowActionsHooks<ProjectSchema[string]["actions"]>;
    return {
      useListRow: (opts = {}, config = {}) => {
        const qoreClient = useClient();
        const [data, setData] = React.useState<ProjectSchema[string]["read"][]>(
          []
        );
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);

        const prev = React.useRef<
          | undefined
          | (PromisifiedSource<
              QoreOperationResult<
                AxiosRequestConfig,
                ProjectSchema[K]["read"][]
              >
            > & {
              fetchMore: (fetchMoreOptions: typeof opts) => Promise<void>;
            })
        >(undefined);

        const stream = React.useMemo(() => {
          const request = (isTable
            ? qoreClient.table(currentViewId)
            : qoreClient.view(currentViewId)
          ).readRows(opts, config);
          // We manually ensure reference equality if the key hasn't changed
          // source: https://github.com/FormidableLabs/urql/blob/main/packages/react-urql/src/hooks/useRequest.ts#L14
          if (prev.current?.operation.key === request.operation.key) {
            return prev.current;
          } else {
            prev.current = request;
            return request;
          }
        }, [stableHash(opts), stableHash(config), currentViewId, isTable]);

        React.useEffect(() => {
          setStatus("loading");
          const subscription = stream.subscribe(({ error, data }) => {
            if (error) {
              setError(error);
              setStatus("error");
            }
            if (data) {
              setError(null);
              setData(data);
              setStatus("success");
            }
          });
          return () => {
            subscription?.unsubscribe();
          };
        }, [stream]);

        const revalidate = React.useCallback(
          async (config?: Partial<QoreOperationConfig>) => {
            const result = await stream.revalidate(config);

            return result;
          },
          [stream.revalidate]
        );
        return { data, error, status, revalidate, fetchMore: stream.fetchMore };
      },

      useGetRow: (rowId, config = {}) => {
        const qoreClient = useClient();
        const [data, setData] = React.useState<
          ProjectSchema[string]["read"] | null
        >(null);
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);

        const prev = React.useRef<
          | undefined
          | PromisifiedSource<
              QoreOperationResult<AxiosRequestConfig, ProjectSchema[K]["read"]>
            >
        >(undefined);

        const stream = React.useMemo(() => {
          const request = (isTable
            ? qoreClient.table(currentViewId)
            : qoreClient.view(currentViewId)
          ).readRow(rowId, config);
          // We manually ensure reference equality if the key hasn't changed
          // source: https://github.com/FormidableLabs/urql/blob/main/packages/react-urql/src/hooks/useRequest.ts#L14
          if (prev.current?.operation.key === request.operation.key) {
            return prev.current;
          } else {
            prev.current = request;
            return request;
          }
        }, [rowId, stableHash(config), currentViewId, isTable]);

        React.useEffect(() => {
          setStatus("loading");
          const subscription = stream.subscribe(({ data, error }) => {
            if (error) {
              setError(error);
              setStatus("error");
            }
            if (data) {
              setData(data);
              setError(null);
              setStatus("success");
            }
          });
          return () => {
            subscription?.unsubscribe();
          };
        }, [stream]);

        const revalidate = React.useCallback(
          async (config?: Partial<QoreOperationConfig>) => {
            const result = await stream.revalidate(config);
            return result;
          },
          [stream.revalidate]
        );

        return { data, error, status, revalidate };
      },

      useInsertRow: (config?: Partial<QoreOperationConfig>) => {
        const qoreClient = useClient();
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);

        const insertRow = React.useCallback(
          async (data: Partial<ProjectSchema[string]["write"]>) => {
            try {
              setStatus("loading");
              const result = await (isTable
                ? qoreClient.table(currentViewId)
                : qoreClient.view(currentViewId)
              ).insertRow(data, config);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId, isTable]
        );

        return { insertRow, status, error };
      },

      useUpdateRow: (config?: Partial<QoreOperationConfig>) => {
        const qoreClient = useClient();
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);

        const updateRow = React.useCallback(
          async (
            rowId: string,
            data: Partial<ProjectSchema[string]["write"]>
          ) => {
            try {
              setStatus("loading");
              const result = await (isTable
                ? qoreClient.table(currentViewId)
                : qoreClient.view(currentViewId)
              ).updateRow(rowId, data, config);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId, isTable]
        );

        return { updateRow, status, error };
      },

      useDeleteRow: (config?: Partial<QoreOperationConfig>) => {
        const qoreClient = useClient();
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null | any>(null);

        const deleteRow = React.useCallback(
          async (rowId: string, config?: Partial<QoreOperationConfig>, params?: ProjectSchema[K]["params"]) => {
            try {
              setStatus("loading");
              const result = await (isTable
                ? qoreClient.table(currentViewId)
                : qoreClient.view(currentViewId)
              ).deleteRow(rowId, config, params);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId, isTable]
        );

        return { deleteRow, status, error };
      },

      useActions: rowId => {
        const qoreClient = useClient();
        const qoreClientRowActions = (isTable
          ? qoreClient.table(currentViewId)
          : qoreClient.view(currentViewId)
        ).actions;

        const [statuses, setStatuses] = React.useState<
          Record<keyof RowActions<ProjectSchema>, QoreRequestStatus>
        >(
          Object.keys(qoreClientRowActions).reduce(
            (prev, curr) => ({ ...prev, [curr]: "idle" }),
            {} as Record<keyof RowActions<ProjectSchema>, QoreRequestStatus>
          )
        );

        const [errors, setErrors] = React.useState<
          Record<keyof RowActions<ProjectSchema>, Error | null>
        >(
          Object.keys(qoreClientRowActions).reduce(
            (prev, curr) => ({ ...prev, [curr]: null }),
            {} as Record<keyof RowActions<ProjectSchema>, Error | null>
          )
        );

        const createAction = React.useCallback(
          <A extends keyof RowActionsHooks<ProjectSchema[K]["actions"]>>(
            actionId: A
          ): RowActionsHooks<ProjectSchema[K]["actions"]>[A] => ({
            trigger: async input => {
              try {
                setStatuses({ ...statuses, [actionId]: "loading" });
                const result = await (isTable
                  ? qoreClient.table(currentViewId)
                  : qoreClient.view(currentViewId)
                )
                  .action(actionId)
                  .trigger(rowId, input);
                setStatuses({ ...statuses, [actionId]: "success" });
                setErrors({ ...errors, [actionId]: null });
                return result;
              } catch (newError) {
                setStatuses({ ...statuses, [actionId]: "error" });
                setErrors({ ...errors, [actionId]: newError });
                return false;
              }
            }
          }),
          [rowId, currentViewId, isTable]
        );

        const action = React.useCallback(
          (actionId: keyof typeof rowActions) => {
            if (!rowActions[actionId]) {
              rowActions[actionId] = createAction(actionId);
            }
            return rowActions[actionId];
          },
          [createAction]
        );
        React.useMemo(() => {
          for (const actionId of Object.keys(
            (isTable
              ? qoreClient.table(currentViewId)
              : qoreClient.view(currentViewId)
            ).actions
          ) as Array<keyof typeof rowActions>) {
            rowActions[actionId] = createAction(actionId);
          }
        }, [createAction, currentViewId, isTable]);

        return {
          statuses,
          errors,
          rowActions,
          action
        };
      },
      useRelation: rowId => {
        const qoreClient = useClient();
        const [statuses, setStatuses] = React.useState<
          Record<RelationActions, QoreRequestStatus>
        >({ addRelation: "idle", removeRelation: "idle" });

        const [errors, setErrors] = React.useState<
          Record<RelationActions, Error | null>
        >({ removeRelation: null, addRelation: null });

        const addRelation = React.useCallback(
          async relations => {
            setStatuses(statuses => ({
              ...statuses,
              addRelation: "loading"
            }));
            try {
              await (isTable
                ? qoreClient.table(currentViewId)
                : qoreClient.view(currentViewId)
              ).addRelation(rowId, relations);

              setStatuses(statuses => ({
                ...statuses,
                addRelation: "success"
              }));
              setErrors(errors => ({ ...errors, addRelation: null }));
              return true;
            } catch (error: any) {
              setStatuses(statuses => ({
                ...statuses,
                addRelation: "error"
              }));
              setErrors(errors => ({ ...errors, addRelation: error }));
              return false;
            }
          },
          [currentViewId, rowId, isTable]
        );

        const removeRelation = React.useCallback(
          async relations => {
            setStatuses(statuses => ({
              ...statuses,
              removeRelation: "loading"
            }));
            try {
              await (isTable
                ? qoreClient.table(currentViewId)
                : qoreClient.view(currentViewId)
              ).removeRelation(rowId, relations);

              setStatuses(statuses => ({
                ...statuses,
                removeRelation: "success"
              }));
              setErrors(errors => ({ ...errors, removeRelation: null }));
              return true;
            } catch (error: any) {
              setStatuses(statuses => ({
                ...statuses,
                removeRelation: "error"
              }));
              setErrors(errors => ({ ...errors, removeRelation: error }));
              return false;
            }
          },
          [currentViewId, rowId, isTable]
        );

        return {
          statuses,
          errors,
          addRelation,
          removeRelation
        };
      }
    };
  }

  function createInsightHooks<K extends keyof ProjectSchema>(
    currentViewId: K
  ): InsightHooks<ProjectSchema[K]> {
    return {
      useListRow: (opts = {}, config = {}) => {
        const qoreClient = useClient();
        const [data, setData] = React.useState<ProjectSchema[string]["read"][]>(
          []
        );
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);

        const prev = React.useRef<
          | undefined
          | (PromisifiedSource<
              QoreOperationResult<
                AxiosRequestConfig,
                ProjectSchema[K]["read"][]
              >
            > & {
              fetchMore: (fetchMoreOptions: typeof opts) => Promise<void>;
            })
        >(undefined);

        const stream = React.useMemo(() => {
          const request = qoreClient
            .insight(currentViewId)
            .readRows(opts, config);
          // We manually ensure reference equality if the key hasn't changed
          // source: https://github.com/FormidableLabs/urql/blob/main/packages/react-urql/src/hooks/useRequest.ts#L14
          if (prev.current?.operation.key === request.operation.key) {
            return prev.current;
          } else {
            // @ts-ignore
            prev.current = request;
            return request;
          }
        }, [stableHash(opts), stableHash(config), currentViewId]);

        React.useEffect(() => {
          setStatus("loading");
          const subscription = stream.subscribe(({ error, data }) => {
            if (error) {
              setError(error);
              setStatus("error");
            }
            if (data) {
              setError(null);
              setData(data);
              setStatus("success");
            }
          });
          return () => {
            subscription?.unsubscribe();
          };
        }, [stream]);

        const revalidate = React.useCallback(
          async (config?: Partial<QoreOperationConfig>) => {
            const result = await stream.revalidate(config);

            return result;
          },
          [stream.revalidate]
        );
        return { data, error, status, revalidate, fetchMore: async () => {} };
      }
    };
  }

  const useClient = () => {
    const { client } = React.useContext(context);
    return client;
  };
  const views = new Proxy<QoreContextViews<ProjectSchema>>(
    {} as QoreContextViews<ProjectSchema>,
    {
      // @ts-ignore
      get: <K extends keyof ProjectSchema>(
        views: QoreContextViews<ProjectSchema>,
        currentViewId: K
      ): QoreHooks<ProjectSchema[K]> => {
        if (!views[currentViewId]) {
          views[currentViewId] = createViewHooks(currentViewId);
        }
        return views[currentViewId];
      }
    }
  );

  const tables = new Proxy<QoreContextViews<ProjectSchema>>(
    {} as QoreContextViews<ProjectSchema>,
    {
      // @ts-ignore
      get: <K extends keyof ProjectSchema>(
        tables: QoreContextViews<ProjectSchema>,
        currentViewId: K
      ): QoreHooks<ProjectSchema[K]> => {
        if (!tables[currentViewId]) {
          tables[currentViewId] = createViewHooks(currentViewId, true);
        }
        return tables[currentViewId];
      }
    }
  );

  const insights = new Proxy<QoreContextInsights<ProjectSchema>>(
    {} as QoreContextInsights<ProjectSchema>,
    {
      // @ts-ignore
      get: <K extends keyof ProjectSchema>(
        insights: QoreContextInsights<ProjectSchema>,
        currentInsightId: K
      ): InsightHooks<ProjectSchema[K]> => {
        if (!insights[currentInsightId]) {
          insights[currentInsightId] = createInsightHooks(currentInsightId);
        }
        return insights[currentInsightId];
      }
    }
  );

  function view<K extends keyof ProjectSchema>(
    id: K
  ): QoreHooks<ProjectSchema[K]> {
    if (!views[id]) {
      views[id] = createViewHooks(id);
    }
    return views[id];
  }

  function table<K extends keyof ProjectSchema>(
    id: K
  ): QoreHooks<ProjectSchema[K]> {
    if (!tables[id]) {
      tables[id] = createViewHooks(id, true);
    }
    return tables[id];
  }

  function insight<K extends keyof ProjectSchema>(
    id: K
  ): InsightHooks<ProjectSchema[K]> {
    if (!insights[id]) {
      insights[id] = createInsightHooks(id);
    }
    return insights[id];
  }

  return {
    views,
    view,
    table,
    insight,
    client,
    context,
    useClient,
    useCurrentUser
  };
};

export default createQoreContext;
