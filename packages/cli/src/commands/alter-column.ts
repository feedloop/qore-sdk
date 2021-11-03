import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import chalk from "chalk";

export default class AlterColumn extends Command {
  static description = "Rename column from a specific table";
  static example = `$ qore tableName formerName newName`;
  static args = [
    { name: "table name" },
    { name: "former columnName" },
    { name: "new columnName" }
  ];
  static flags = {
    apiKey: flags.string({ description: "apiKey" })
  };

  async run() {
    const { flags, argv } = this.parse(AlterColumn);
    const client = new DefaultApi(new Configuration({ apiKey: flags.apiKey }));
    cli.action.start(`${chalk.yellow("Rename column ....")}`, "initializing", {
      stdout: true
    });
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Column,
          migration: { from: argv[1], to: argv[2], table: argv[0] }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
