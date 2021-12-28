import {
  Configuration,
  DefaultApi,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";
import config from "../config";

export default class AlterTable extends Command {
  static description = "Rename specific table";

  static examples = [`$ qore alter-table formerName newName`];

  static args = [{ name: "formerName" }, { name: "newName" }];

  async run() {
    const { args } = this.parse(AlterTable);
    const { formerName, newName } = args;

    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    cli.action.start(
      `\n${chalk.grey(`Renaming table "${formerName}" to "${newName}"`)}`,
      "initializing",
      { stdout: true }
    );

    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Table,
          migration: { from: formerName, to: newName }
        }
      ]
    });

    cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
