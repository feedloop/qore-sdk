import { QoreClient, ProjectSchema } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import config from "../qore.config.json";
import schema from "../qore.schema.json";

export const client = new QoreClient<ProjectSchema>(config);
client.init(schema as any);

export default createQoreContext(client);
