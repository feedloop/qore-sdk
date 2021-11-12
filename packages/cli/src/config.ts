import Conf, { Schema } from "conf";

export type CLIConfig = { apiKey: string };

export const schema: Schema<CLIConfig> = {
  apiKey: { type: "string", description: "apiKey" }
};

const config = new Conf({
  schema
});

export default config;
