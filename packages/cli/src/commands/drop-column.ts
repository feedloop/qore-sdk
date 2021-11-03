import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import chalk from "chalk";

export default class DropColumn extends Command {
  static description = "Drop column from specific table";
  static examples = [`$ qore drop-column tableName columnName`];
  static args = [{ name: "table name" }, { name: "column name" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey" })
  };

  async run() {
    const { argv, flags } = this.parse(DropColumn);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    const validation = await cli.prompt("Are you sure? Y|N");
    const response = validation.toLowerCase();
    cli.action.start(`${chalk.yellow("Drop column ...")}`, "initializing", {
      stdout: true
    });
    if (response === "y" || response === "yes") {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Column,
            migration: { table: argv[0], column: argv[1] }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else if (response === "n" || response === "no") {
      cli.action.stop(`${chalk.red("Cancell")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}
