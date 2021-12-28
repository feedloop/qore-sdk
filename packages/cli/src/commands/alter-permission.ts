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
  static description =
    "Change condition in permissions table for specific role";

  static examples = [
    `$ qore alter-permission --role users --action select --condition '{"$and": [ { "title": { "$eq": "sleeping" } } ]}' --tables all`,
    `$ qore alter-permission --role users --action delete --condition  '{"$and": [ { "title": { "$eq": "add fitur login" } } ]}' --tables todos,projects`
  ];

  static flags = {
    role: flags.string({ description: "roleName", required: true }),
    action: flags.string({ description: "action", required: true }),
    condition: flags.string({ description: "condition", required: true }),
    tables: flags.string({ description: "tables", required: true })
  };

  async run() {
    const { flags } = this.parse(AlterPermission);
    const { role, action, condition, tables } = flags;
    const listTables = tables.toLowerCase().includes("all")
      ? ["*"]
      : tables.split(",");
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    const statement = listTables.includes("*") ? "all" : listTables;

    cli.action.start(
      `\n${chalk.grey(`Change permission`)} ${chalk.blue(
        `"${flags.action}"`
      )} ${chalk.grey("condition for role")} ${chalk.blue(
        `"${flags.role}"`
      )} ${chalk.grey("in")} ${chalk.blue(`"${statement}"`)} ${chalk.grey(
        "table"
      )} `,
      "initializing",
      { stdout: true }
    );

    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Alter,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: role,
            action: action,
            tables: listTables,
            condition: JSON.parse(condition)
          }
        }
      ]
    });

    cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
  }
}
