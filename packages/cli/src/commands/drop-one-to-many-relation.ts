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

export default class DropOneToManyRelation extends Command {
  static description = "Drop column OneToManyRelation";

  static examples = [
    `$ qore drop-relation 1:m tableOrigin tableTarget relationName`
  ];
  static args = [
    { name: "tableOrigin" },
    { name: "tableTarget" },
    { name: "relationName" }
  ];

  async run() {
    const { args } = this.parse(DropOneToManyRelation);
    const { tableOrigin, tableTarget, relationName } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropOneToManyRelation",
        message: `Are you sure to delete ${chalk.blue(
          `"${relationName}"`
        )} column in ${chalk.blue(`"${tableTarget}"`)}?`,
        default: false
      }
    ]);

    cli.action.start(
      `Drop relationName ${chalk.blue(
        `"${relationName}"`
      )} from table ${chalk.blue(`"${tableTarget}"`)}`,
      "initializing",
      { stdout: true }
    );

    if (response.dropOneToManyRelation) {
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Drop,
            resource: V1MigrateOperationsResourceEnum.OneToManyRelation,
            migration: {
              one: { table: tableOrigin },
              many: { table: tableTarget },
              name: relationName
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
