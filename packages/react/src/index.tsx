import React from "react";
import {
  QoreSchema,
  QoreClient,
  QoreOperationConfig,
  RowActions,
  QoreViewSchema,
  QoreOperationResult,
  FormDriver
} from "@feedloop/qore-client";
import { AxiosRequestConfig } from "axios";
import { ConditionalPick } from "type-fest";

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

type QoreHooks<T extends QoreSchema[string]> = {
  useListRow: (
    opts?: {
      limit?: number;
      offset?: number;
      order?: "asc" | "desc";
    } & T["params"],
    config?: Partial<QoreOperationConfig>
  ) => {
    data: T["read"][];
    status: QoreRequestStatus;
    error: Error | null;
    fetchMore(fetchMoreOpts: typeof opts): Promise<void>;
    revalidate: (
      config?: Partial<QoreOperationConfig>
    ) => Promise<
      QoreOperationResult<
        AxiosRequestConfig,
        {
          nodes: T["read"][];
        }
      >
    >;
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
      config?: Partial<QoreOperationConfig>
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

  useForm: <K extends keyof T["forms"]>(
    formId: K
  ) => {
    send: (params: T["forms"][K]) => Promise<{ id: string }>;
    status: QoreRequestStatus;
    error: Error | null;
  };
};

type QoreContextViews<ProjectSchema extends QoreSchema> = {
  [ViewName in keyof ProjectSchema]: QoreHooks<ProjectSchema[ViewName]>;
};

const createQoreContext = <ProjectSchema extends QoreSchema>(
  client: QoreClient<ProjectSchema>
) => {
  const context = React.createContext<{
    client: QoreClient<ProjectSchema>;
  }>({ client });

  const useCurrentUser = () => {
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
    }, []);
    return { status, error, user };
  };

  function createViewHooks<K extends keyof ProjectSchema>(
    currentViewId: K
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

        const stream = React.useMemo(
          () => qoreClient.view(currentViewId).readRows(opts, config),
          [
            ...Object.entries(opts).flat(),
            ...Object.entries(config).flat(),
            currentViewId
          ]
        );

        React.useEffect(() => {
          setStatus("loading");
          const subscription = stream.subscribe(({ error, data }) => {
            if (error) {
              setError(error);
              setStatus("error");
            }
            if (data) {
              setError(null);
              setData(data.results.data);
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

            return {
              ...result,
              data: { nodes: result.data?.results.data || [] }
            };
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

        const stream = React.useMemo(
          () => qoreClient.view(currentViewId).readRow(rowId, config),
          [rowId, ...Object.entries(config).flat(), currentViewId]
        );

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
              const result = await qoreClient
                .view(currentViewId)
                .insertRow(data, config);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId]
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
              const result = await qoreClient
                .view(currentViewId)
                .updateRow(rowId, data, config);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId]
        );

        return { updateRow, status, error };
      },

      useDeleteRow: (config?: Partial<QoreOperationConfig>) => {
        const qoreClient = useClient();
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null | any>(null);

        const deleteRow = React.useCallback(
          async (rowId: string) => {
            try {
              setStatus("loading");
              const result = await qoreClient
                .view(currentViewId)
                .deleteRow(rowId, config);
              setError(null);
              setStatus("success");
              return result;
            } catch (error: any) {
              setStatus("error");
              setError(error);
            }
          },
          [currentViewId]
        );

        return { deleteRow, status, error };
      },

      useActions: rowId => {
        const qoreClient = useClient();
        const qoreClientRowActions = qoreClient.view(currentViewId).actions;

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
                const result = await qoreClient
                  .view(currentViewId)
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
          [rowId, currentViewId]
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
            qoreClient.view(currentViewId).actions
          ) as Array<keyof typeof rowActions>) {
            rowActions[actionId] = createAction(actionId);
          }
        }, [createAction, currentViewId]);

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
              await qoreClient
                .view(currentViewId)
                .addRelation(rowId, relations);

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
          [currentViewId, rowId]
        );

        const removeRelation = React.useCallback(
          async relations => {
            setStatuses(statuses => ({
              ...statuses,
              removeRelation: "loading"
            }));
            try {
              await qoreClient
                .view(currentViewId)
                .removeRelation(rowId, relations);

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
          [currentViewId, rowId]
        );

        return {
          statuses,
          errors,
          addRelation,
          removeRelation
        };
      },
      useForm: <F extends keyof ProjectSchema[K]["forms"]>(formId: F) => {
        const qoreClient = useClient();
        const form = qoreClient.view(currentViewId).form(formId);
        const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
        const [error, setError] = React.useState<Error | null>(null);
        const send = React.useCallback(
          async (params: ProjectSchema[K]["forms"][F]) => {
            try {
              setStatus("loading");
              const resp = await form.sendForm(params);
              setError(null);
              setStatus("success");
              return resp;
            } catch (error: any) {
              setStatus("error");
              setError(error);
              throw error;
            }
          },
          []
        );
        return { send, error, status };
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

  function view<K extends keyof ProjectSchema>(
    id: K
  ): QoreHooks<ProjectSchema[K]> {
    if (!views[id]) {
      views[id] = createViewHooks(id);
    }
    return views[id];
  }

  return {
    views,
    view,
    client,
    context,
    useClient,
    useCurrentUser
  };
};

export default createQoreContext;
