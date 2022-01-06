import { QoreClient } from "@feedloop/qore-client";
import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient(config);
client.init(schema);

export default client;
