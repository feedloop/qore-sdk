import { flags } from "@oclif/command";
import prompts from "prompts";
import config, { CLIConfig, schema } from "./config";

export const adminSecretFlag = flags.string({
  name: "adminSecret",
  description: "admin secret",
  default: () => config.get("project") as string
});

export const urlFlag = flags.string({
  name: "url",
  description: "project url",
  default: () => config.get("project") as string
});

export const configFlags: flags.Input<CLIConfig> = {
  adminSecret: adminSecretFlag,
  url: urlFlag
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
