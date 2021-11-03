import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import cli from "cli-ux";
import chalk from "chalk";

export default class CreateTable extends Command {
  static description = "create a table in this project";

  static examples = [`$ qore create-table tableName`];
  static args = [{ name: "table name" }];

  static flags = {
    apiKey: flags.string({ description: "apiKey" })
  };

  async run() {
    const { flags, argv } = this.parse(CreateTable);
    const client = new DefaultApi(
      new Configuration({ apiKey: `${flags.apiKey}` })
    );

    cli.action.start("Create table ...", "initializing", { stdout: true });
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Table,
          migration: {
            name: argv[0]
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
