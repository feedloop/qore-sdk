import { QoreClient } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import config from "../qore.config.json";
import schema from "../qore.schema.json";
import { QoreProjectSchema } from "../qore-generated";

export const client = new QoreClient<QoreProjectSchema>({
  ...config,
  getToken: () => {
    return "ac27480d-3d6e-43ce-a51a-18c97a4a8aae";
  }
});
client.init(schema as any);

export default createQoreContext(client);
