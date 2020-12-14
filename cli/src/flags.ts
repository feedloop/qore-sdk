import { flags } from "@oclif/command";
import prompts from "prompts";
import config, { CLIConfig, schema } from "./config";

export const projectFlag = flags.string({
  name: "project",
  description: "project id",
  default: () => config.get("project"),
});

export const orgFlag = flags.string({
  name: "org",
  description: "organization id",
  default: () => config.get("org"),
});

export const tokenFlag = flags.string({
  name: "token",
  description: "organization id",
  default: () => config.get("token"),
});

export const configFlags: flags.Input<CLIConfig> = {
  project: projectFlag,
  org: orgFlag,
  token: tokenFlag,
};

export const promptFlags = async (
  configFromStorage: Partial<CLIConfig>
): Promise<CLIConfig> => {
  const remainingConfig = Object.keys(schema).filter(
    (key) => !(key in configFromStorage)
  ) as Array<keyof CLIConfig>;
  const data = await prompts<keyof CLIConfig>(
    remainingConfig
      .map((key) => ({ key, field: schema[key] }))
      .map(({ key, field }) => ({
        message: `Enter your ${field?.description}`,
        name: key,
        type: "text",
      }))
  );
  return { ...data, ...configFromStorage };
};
