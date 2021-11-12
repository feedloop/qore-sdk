import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import config from "../config";

export default class CreatePermission extends Command {
  static description = "Create permission for role in table";

  static examples = [`$ qore create-permission roleName tableName action`];
  // qore create-permission presiden --tables task person todo project --actions insert delete --condition "{$and : []}"
  static args = [
    { name: "roleName" },
    { name: "tableName" },
    { name: "action" }
  ];

  async run() {
    const { args } = this.parse(CreatePermission);
    const { roleName, tableName, action } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    // *
    await client.migrate({
      operations: [
        {
          operation: V1MigrateOperationsOperationEnum.Create,
          resource: V1MigrateOperationsResourceEnum.Permission,
          migration: {
            role: roleName,
            tables: [tableName],
            condition: { $and: [] },
            actions: ["insert"]
          }
        }
      ]
    });

    console.log("masuk nih");
  }
}
