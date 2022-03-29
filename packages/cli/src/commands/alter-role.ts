import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@qorebase/sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class AlterRole extends Command {
  static description = "Rename specific role";

  static examples = [`$ qore alter-role formerName newName`];

  static args = [{ name: "formerName" }, { name: "newName" }];

  async run() {
    const { args } = this.parse(AlterRole);
    const { formerName, newName } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    cli.action.start(
      `\n${chalk.grey(`Renaming role "${formerName}" to "${newName}"`)}`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Role,
          migration: { from: formerName, to: newName }
        }
      ]
    });

    cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
