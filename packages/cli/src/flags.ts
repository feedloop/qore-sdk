import { flags } from "@oclif/command";
import prompts from "prompts";
import config, { CLIConfig, schema } from "./config";

export const projectFlag = flags.string({
  name: "project",
  description: "project id",
  default: () => config.get("project")
});

export const orgFlag = flags.string({
  name: "org",
  description: "organization id",
  default: () => config.get("org")
});

export const tokenFlag = flags.string({
  name: "token",
  description: "organization id",
  default: () => config.get("token")
});

export const configFlags: flags.Input<CLIConfig> = {
  project: projectFlag,
  org: orgFlag,
  token: tokenFlag
};

export const promptFlags = async <T = {}>(
  partialValues: Partial<T>,
  flags: { [K in keyof T]: flags.IFlag<T[K]> }
): Promise<T> => {
  const remainingConfig = Object.keys(flags).filter(
    key => !(key in partialValues)
  ) as Array<keyof T>;
  // @ts-ignore
  const data = await prompts<keyof T>(
    remainingConfig
      .map(key => ({ key, field: flags[key] }))
      .map(({ key, field }) => ({
        message: `Enter your ${field?.description}`,
        name: key,
        type: "text"
      }))
  );
  return { ...data, ...partialValues };
};
