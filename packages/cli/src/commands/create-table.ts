import { Command } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import cli from "cli-ux";
import chalk from "chalk";
import config from "../config";

export default class CreateTable extends Command {
  static description = "Create a table in this project";

  static examples = [`$ qore create-table tableName`];

  static args = [{ name: "tableName" }];

  async run() {
    const { args } = this.parse(CreateTable);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    cli.action.start(
      `Create table ${chalk.blue(`"${args.tableName}"`)}`,
      "initializing",
      { stdout: true }
    );

    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Table,
          migration: {
            name: args.tableName
          }
        }
      ]
    });

    cli.action.stop(`${chalk.green("Success")}`);
  }
}
