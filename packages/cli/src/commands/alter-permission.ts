import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class AlterPermission extends Command {
  static description = "Change permission condition for specific role";
  static examples = [
    `$ qore alter-permission --role roleName --action select --condition '{"$and": []}' --table tableName`
  ];

  static flags = {
    role: flags.string({ description: "roleName", required: true }),
    action: flags.string({ description: "action", required: true }),
    condition: flags.string({ description: "condition", required: true }),
    table: flags.string({ description: "table" })
  };

  async run() {
    const { flags } = this.parse(AlterPermission);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `Change permission condition for role ${chalk.blue(`"${flags.role}"`)}`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: flags.role,
            action: flags.action,
            table: flags.table,
            condition: flags.action
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
