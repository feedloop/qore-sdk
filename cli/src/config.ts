import Conf, { Schema } from "conf";

export type CLIConfig = { token: string; project: string; org: string };

export const schema: Schema<CLIConfig> = {
  token: { type: "string", description: "Token" },
  project: { type: "string", description: "Project ID" },
  org: { type: "string", description: "Organization ID" }
};

const config = new Conf({
  schema
});

export default config;
