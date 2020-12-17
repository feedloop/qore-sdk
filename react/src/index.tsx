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
  };

  useUpdateRow: () => {
    updateRow: (rowId: string, data: T["write"]) => void;
    status: QoreRequestStatus;
  };

  useDeleteRow: () => {
    deleteRow: (rowId: string) => void;
    status: QoreRequestStatus;
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
          const insertRow = (data: ProjectSchema[string]["write"]) => {};
          const status = "idle";
          return { insertRow, status };
        },

        useUpdateRow: () => {
          const updateRow = (
            rowId: string,
            data: ProjectSchema[string]["write"]
          ) => {};
          const status = "idle";
          return { updateRow, status };
        },

        useDeleteRow: (): {
          deleteRow: (rowId: string) => void;
          status: QoreRequestStatus;
        } => {
          const deleteRow = (rowId: string) => {};
          const status = "idle";
          return { deleteRow, status };
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
