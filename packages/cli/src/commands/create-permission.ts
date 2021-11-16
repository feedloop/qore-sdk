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
    `$ qore create-permission --role roleName --tables table1,table2 --actions select,delete --conditions '{"$and": []}'`
  ];

  static flags = {
    role: flags.string({ description: "roleName", required: true }),
    tables: flags.string({ description: "tables", required: true }),
    actions: flags.string({ description: "actions", required: true }),
    conditions: flags.string({ description: "conditions" })
  };

  async run() {
    const { flags } = this.parse(CreatePermission);
    const tables = flags.tables.split(",");
    const actions = flags.actions.split(",");
    const conditions = flags.conditions ? flags.conditions : { $and: [] };
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    cli.action.start(
      `Create permission for role ${chalk.blue(`"${flags.role}"`)}`,
      "initializing",
      { stdout: true }
    );
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: flags.role,
            tables,
            actions,
            conditions
          }
        }
      ]
    });
    cli.action.stop(`${chalk.green("Success")}`);
  }
}
