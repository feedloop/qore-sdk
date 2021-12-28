import Conf, { Schema } from "conf";

export type CLIConfig = { adminSecret: string; url: string };

export const schema: Schema<CLIConfig> = {
  adminSecret: { type: "string", description: "admin secret" },
  url: {
    type: "string",
    description: "project url",
    default: "http://localhost:8080/documentation"
  }
};

const config = new Conf({
  schema
});

export default config;
