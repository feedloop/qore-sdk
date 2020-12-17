import React from "react";
import {
  QoreSchema,
  QoreClient,
  QoreOperationResult,
  ViewDriver
} from "@qore/client";
import { AxiosRequestConfig } from "axios";

type QoreContextValue<ProjectSchema extends QoreSchema> = {
  qoreRef: React.MutableRefObject<QoreClient<ProjectSchema> | null>;
};

type QoreRequestStatus = "idle" | "loading" | "success" | "error";

type QoreHooks<T extends QoreSchema[string]> = {
  useListRow: (
    opts: {
      limit?: number;
      offset?: number;
    } & T["params"]
  ) => {
    data: T["read"][];
    status: QoreRequestStatus;
    error: Error | null;
    revalidate: () => void;
  };

  useGetRow: (
    rowId: string
  ) => {
    data: T["read"] | null;
    status: QoreRequestStatus;
    error: Error | null;
    revalidate: () => void;
  };

  useInsertRow: () => {
    insertRow: (data: T["write"]) => void;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useUpdateRow: () => {
    updateRow: (rowId: string, data: T["write"]) => void;
    status: QoreRequestStatus;
    error: Error | null;
  };

  useDeleteRow: () => {
    deleteRow: (rowId: string) => void;
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
  const qoreContext = React.createContext<QoreContextValue<ProjectSchema>>({
    qoreRef: React.createRef()
  });

  const QoreProvider: React.FC = ({ children }) => {
    const qoreRef = React.useRef<QoreClient<ProjectSchema> | null>(null);

    React.useEffect(() => {
      qoreRef.current = qoreClient;
    }, []);

    return (
      <qoreContext.Provider value={{ qoreRef }}>
        {children}
      </qoreContext.Provider>
    );
  };

  const useQoreContext = () => React.useContext(qoreContext);

  const views: QoreContextViews<ProjectSchema> = Object.keys(
    qoreClient.views
  ).reduce(
    (previous, currentViewId) => ({
      ...previous,
      [currentViewId]: {
        useListRow: opts => {
          const { qoreRef } = useQoreContext();
          const [data, setData] = React.useState<
            ProjectSchema[string]["read"][]
          >([]);
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const streamRef = React.useRef<ReturnType<ViewDriver["readRows"]>>(
            qoreRef.current?.views[currentViewId].readRows(opts) || null
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
                  setData(data);
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

        useGetRow: rowId => {
          const { qoreRef } = useQoreContext();
          const [data, setData] = React.useState<
            ProjectSchema[string]["read"] | null
          >(null);
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const streamRef = React.useRef<ReturnType<ViewDriver["readRow"]>>(
            qoreRef.current?.views[currentViewId].readRow(rowId) || null
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
          const { qoreRef } = useQoreContext();
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const insertRow = async (data: ProjectSchema[string]["write"]) => {
            try {
              setStatus("loading");
              const result = await qoreRef.current?.views[
                currentViewId
              ].insertRow(data);
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
          const { qoreRef } = useQoreContext();
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const updateRow = async (
            rowId: string,
            data: ProjectSchema[string]["write"]
          ) => {
            try {
              setStatus("loading");
              const result = await qoreRef.current?.views[
                currentViewId
              ].updateRow(rowId, data);
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
          const { qoreRef } = useQoreContext();
          const [status, setStatus] = React.useState<QoreRequestStatus>("idle");
          const [error, setError] = React.useState<Error | null>(null);

          const deleteRow = async (rowId: string) => {
            try {
              setStatus("loading");
              const result = await qoreRef.current?.views[
                currentViewId
              ].deleteRow(rowId);
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
    Provider: QoreProvider,
    views
  };
};

export default createQoreContext;
