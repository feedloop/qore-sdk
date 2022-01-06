import { QoreClient } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import Cookies from "js-cookie";

import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient({
  ...config,
  getToken: () => Cookies.get("token")
});
client.init(schema);

const qoreContext = createQoreContext(client);
export default qoreContext;
