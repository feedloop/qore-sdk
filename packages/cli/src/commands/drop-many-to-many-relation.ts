import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";

export default class DropManyToManyRelation extends Command {
  static description = "Drop junctionTable ManyToManyRelation";

  static examples = [
    `$ qore drop-many-to-many-relation m:n tableOrigin tableTarget`
  ];

  static args = [{ name: "tableOrigin" }, { name: "tableTarget" }];

  async run() {
    const { args } = this.parse(DropManyToManyRelation);
    const { tableOrigin, tableTarget } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropManyToManyRelation",
        message: `Are you sure to delete junctionTable of ${chalk.blue(
          `"${tableOrigin}"`
        )} and ${chalk.blue(`"${tableTarget}"`)}?`,
        default: false
      }
    ]);

    cli.action.start(
      `Drop juntionTable of ${chalk.blue(`"${tableOrigin}"`)} and ${chalk.blue(
        `"${tableTarget}"`
      )}`,
      "initializing",
      { stdout: true }
    );

    if (response.dropManyToManyRelation) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.ManyToManyRelation,
            migration: {
              origin: { table: tableOrigin },
              target: { table: tableTarget }
            }
          }
        ]
      });
      cli.action.stop(`${chalk.green("Success")}`);
    } else {
      cli.action.stop(`${chalk.red("Failed")}`);
    }
  }
}
