import Conf, { Schema } from "conf";

export type CLIConfig = { adminSecret: string; url: string };

export const schema: Schema<CLIConfig> = {
  adminSecret: {
    type: "string",
    description: "admin secret",
    default: "admin-secret"
  },
  url: {
    type: "string",
    description: "project url",
    default: "http://localhost:8080/"
  }
};

const config = new Conf({
  schema
});

export default config;
