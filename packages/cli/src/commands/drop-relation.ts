import {
  DefaultApi,
  Configuration,
  V1MigrateOperationsOperationEnum,
  V1MigrateOperationsResourceEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import cli from "cli-ux";
import inquirer from "inquirer";
import config from "../config";

export default class DropRelation extends Command {
  static description =
    "Drop relation column in 1:m or drop junction table if m:n relation ";

  static examples = [
    `$ qore drop-relation 1:m tableOrigin/tableOne tableTarget/tableMany --relation personTodo`,
    `$ qore drop-relation m:n tableOrigin/tableOne tableTarget/tableMany --relation personProject`
  ];
  static args = [
    { name: "relationType" },
    { name: "tableOrigin/tableOne" },
    { name: "tableTarget/tableMany" }
  ];

  static flags = {
    relation: flags.string({ description: "relationName", required: true })
  };
  async run() {
    const { args, flags } = this.parse(DropRelation);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );

    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "dropRelation",
        message: `Are you sure to delete ${chalk.blue(`"${flags.relation}"`)}`,
        default: false
      }
    ]);

    const relationType = args.relationType.toLowerCase();
    if (relationType === "1:m") {
      cli.action.start(
        `\n${chalk.grey(`Drop column OneToManyRelation`)} ${chalk.blue(
          `"${flags.relation}"`
        )} ${chalk.grey("in")} ${chalk.blue(
          `"${args["tableTarget/tableMany"]}"`
        )} ${chalk.grey("table ")}`,
        "initializing",
        { stdout: true }
      );
    } else if (relationType === "m:n") {
      cli.action.start(
        `\n${chalk.grey(`Drop tableJuntion`)} ${chalk.blue(
          `"${flags.relation}"`
        )} ${chalk.grey("table ManyToManyRelation")} ${chalk.grey(
          `for`
        )} ${chalk.blue(`"${args["tableOrigin/tableOne"]}"`)} ${chalk.grey(
          "and"
        )} ${chalk.blue(`"${args["tableTarget/tableMany"]}"`)} ${chalk.grey(
          `table `
        )}`,
        "initializing",
        { stdout: true }
      );
    }

    if (response.dropRelation) {
      if (relationType === "1:m") {
        await client.migrate({
          operations: [
            {
              operation: V1MigrateOperationsOperationEnum.Drop,
              resource: V1MigrateOperationsResourceEnum.OneToManyRelation,
              migration: {
                one: { table: args["tableOrigin/tableOne"] },
                many: { table: args["tableTarget/tableMany"] },
                name: flags.relation
              }
            }
          ]
        });
      } else if (relationType === "m:n") {
        await client.migrate({
          operations: [
            {
              operation: V1MigrateOperationsOperationEnum.Drop,
              resource: V1MigrateOperationsResourceEnum.ManyToManyRelation,
              migration: {
                origin: { table: args["tableOrigin/tableOne"] },
                target: { table: args["tableTarget/tableMany"] },
                name: flags.relation
              }
            }
          ]
        });
      }

      cli.action.stop(`${chalk.green("\n\nSuccess\n\n")}`);
    } else {
      cli.action.stop(`${chalk.red("\n\nFailed\n\n")}`);
    }
  }
}
