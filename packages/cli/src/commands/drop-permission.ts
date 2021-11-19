import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";
import chalk from "chalk";

export default class DropPermission extends Command {
  static description = "Drop action permission for role in tables";

  static examples = [
    `$ qore drop-permission select --role user --tables all`,
    `$ qore drop-permission delete --role user --tables todos,projects`
  ];

  static args = [{ name: "action", description: "actionName" }];

  static flags = {
    role: flags.string({ description: "roleName", required: true }),
    tables: flags.string({ description: "tables", required: true })
  };

  async run() {
    const { flags, args } = this.parse(DropPermission);
    const { role, tables } = flags;
    const listTables = tables.toLowerCase().includes("all")
      ? ["*"]
      : tables.split(",");
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const statement = listTables.includes("*") ? "all" : listTables;
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropPermission",
        message: `Are you sure to remove ${chalk.blue(
          `"${args.action}"`
        )} permission for ${chalk.blue(`"${flags.role}"`)}?`,
        default: false
      }
    ]);

    cli.action.start(
      `\n${chalk.grey("Drop")} ${chalk.blue(`"${args.action}"`)} ${chalk.grey(
        "permission for"
      )} ${chalk.blue(`"${flags.role}"`)} ${chalk.grey("in")} ${chalk.blue(
        `"${statement}"`
      )} ${chalk.grey("table")} ...`,
      "initializing",
      { stdout: true }
    );

    if (response.dropPermission) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.Permission,
            migration: { role, action: args.action, tables: listTables }
          }
        ]
      });

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
