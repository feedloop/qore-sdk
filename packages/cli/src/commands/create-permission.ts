import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import config from "../config";

export default class CreatePermission extends Command {
  static description = "Create permission for specific role in specific tables";
  static examples = [
    `$ qore create-permission --role users --tables todos,projects --actions select,delete --condition '{"$and": []}'`
  ];

  static flags = {
    role: flags.string({ description: "roleName", required: true }),
    tables: flags.string({ description: "tables", required: true }),
    actions: flags.string({ description: "actions", required: true }),
    condition: flags.string({ description: "condition" })
  };

  async run() {
    const { flags } = this.parse(CreatePermission);
    const tables = flags.tables.split(",");
    const actions = flags.actions.split(",");
    const condition = flags.condition
      ? JSON.parse(flags.condition)
      : { $and: [] };

    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    this.log(`${chalk.yellow(`\nRunning process ...\n`)}`);
    for (let i = 0; i < tables.length; i++) {
      this.log(
        `${chalk.grey(`#${i + 1} Create permission-`)}${chalk.blue(
          `"${actions}"`
        )} ${chalk.grey("for")} ${chalk.grey(`"${flags.role}"`)} ${chalk.grey(
          `in table "${tables[i]}"`
        )}`
      );
    }
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: flags.role,
            tables,
            actions,
            condition
          }
        }
      ]
    });
    this.log(`${chalk.green("\nSuccess\n")}`);
  }
}
