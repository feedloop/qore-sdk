import React from "react";
import {
  QoreSchema,
  QoreClient,
  ViewDriver,
  QoreOperationConfig
} from "@qore/client";

type QoreRequestStatus = "idle" | "loading" | "success" | "error";

type QoreHooks<T extends QoreSchema[string]> = {
  useListRow: (
    opts?: {
      limit?: number;
      offset?: number;
    } & T["params"],
    config?: Partial<QoreOperationConfig>
  ) => {
    data: T["read"][];
    status: QoreRequestStatus;
    error: Error | null;
    revalidate: () => void;
  };

  useGetRow: (
    rowId: string,
    config?: Partial<QoreOperationConfig>
  ) => {
    data: T["read"] | null;
    status: QoreRequestStatus;
    error: Error | null;
    revalidate: () => void;
  };

  useInsertRow: () => {
    insertRow: (data: T["write"]) => Promise<T["read"]>;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useUpdateRow: () => {
    updateRow: (rowId: string, data: T["write"]) => Promise<T["read"]>;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useDeleteRow: () => {
    deleteRow: (rowId: string) => Promise<boolean>;
    status: QoreRequestStatus;
    error: Error | null;
  };
};

type QoreContextViews<ProjectSchema extends QoreSchema> = {
  [ViewName in keyof ProjectSchema]: QoreHooks<ProjectSchema[ViewName]>;
};

const createQoreContext = <ProjectSchema extends QoreSchema>(
  qoreClient: QoreClient<ProjectSchema>
) => {
  const views: QoreContextViews<ProjectSchema> = Object.keys(
    qoreClient.views
  ).reduce(
    (previous, currentViewId) => ({
      ...previous,
      [currentViewId]: {
        useListRow: (opts, config) => {
          const [data, setData] = React.useState<
            ProjectSchema[string]["read"][]
          >([]);
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const streamRef = React.useRef<ReturnType<ViewDriver["readRows"]>>(
            qoreClient.views[currentViewId].readRows(opts, config)
          );

          const revalidate = streamRef.current?.revalidate;

          React.useEffect(() => {
            setStatus("loading");
            const subscription = streamRef.current?.subscribe(
              ({ error, data }) => {
                if (error) {
                  setError(error);
                  setStatus("error");
                }
                if (data) {
                  setData(data.nodes);
                  setStatus("success");
                }
              }
            );
            return () => {
              subscription?.unsubscribe();
            };
          }, [opts]);

          return { data, error, status, revalidate };
        },

        useGetRow: (rowId, config) => {
          const [data, setData] = React.useState<
            ProjectSchema[string]["read"] | null
          >(null);
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const streamRef = React.useRef<ReturnType<ViewDriver["readRow"]>>(
            qoreClient.views[currentViewId].readRow(rowId, config)
          );

          const revalidate = streamRef.current?.revalidate;

          React.useEffect(() => {
            setStatus("loading");
            const subscription = streamRef.current?.subscribe(
              ({ data, error }) => {
                if (error) {
                  setError(error);
                  setStatus("error");
                }
                if (data) {
                  setData(data);
                  setStatus("success");
                }
              }
            );
            return () => {
              subscription?.unsubscribe();
            };
          }, [rowId]);

          return { data, error, status, revalidate };
        },

        useInsertRow: () => {
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const insertRow = async (data: ProjectSchema[string]["write"]) => {
            try {
              setStatus("loading");
              const result = await qoreClient.views[currentViewId].insertRow(
                data
              );
              setStatus("success");
              return result;
            } catch (error) {
              setStatus("error");
              setError(error);
            }
          };

          return { insertRow, status, error };
        },

        useUpdateRow: () => {
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const updateRow = async (
            rowId: string,
            data: ProjectSchema[string]["write"]
          ) => {
            try {
              setStatus("loading");
              const result = await qoreClient.views[currentViewId].updateRow(
                rowId,
                data
              );
              setStatus("success");
              return result;
            } catch (error) {
              setStatus("error");
              setError(error);
            }
          };

          return { updateRow, status, error };
        },

        useDeleteRow: () => {
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const deleteRow = async (rowId: string) => {
            try {
              setStatus("loading");
              const result = await qoreClient.views[currentViewId].deleteRow(
                rowId
              );
              setStatus("success");
              return result;
            } catch (error) {
              setStatus("error");
              setError(error);
            }
          };

          return { deleteRow, status, error };
        }
      }
    }),
    {} as QoreContextViews<ProjectSchema>
  );

  return {
    views
  };
};

export default createQoreContext;
