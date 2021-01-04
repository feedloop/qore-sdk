import { QoreClient } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import config from "../qore.config.json";
import schema from "../qore.schema.json";
import { QoreProjectSchema } from "../qore-generated";

export const client = new QoreClient<QoreProjectSchema>(config);
client.init(schema as any);

export default createQoreContext(client);
