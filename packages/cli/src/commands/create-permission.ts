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

export default class CreatePermission extends Command {
  static description = "Create permission for role in table";
  static examples = [
    `$ qore create-permission roleName --tables table,table --actions action,action`
  ];
  static args = [{ name: "roleName" }];

  static flags = {
    tables: flags.string({ name: "tables", required: true }),
    actions: flags.string({ name: "actions", required: true })
  };

  async run() {
    const { args, flags } = this.parse(CreatePermission);
    const tables = flags.tables.split(",");
    const actions = flags.actions.split(",");
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `Create permission for role ${chalk.blue(`"${args.roleName}"`)}`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: args.roleName,
            tables,
            actions
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
