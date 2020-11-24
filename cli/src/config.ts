import Conf from "conf";

const config = new Conf<{ accessToken?: string }>({
  schema: { accessToken: { type: "string" } },
});
export default config;
