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

export default class CreateRelation extends Command {
  static description =
    "Create relation 1:m for one-to-many or m:n for many-to-many relation";

  static examples = [
    `$ qore create-relation relationType tableOrigin tableTarget --relation personTodo`
  ];

  static args = [
    { name: "relationType" },
    { name: "tableOrigin" },
    { name: "tableTarget" }
  ];

  static flags = {
    relation: flags.string({ description: "relationName" })
  };

  async run() {
    const { args, flags } = this.parse(CreateRelation);
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );
    const { relationType, tableOrigin, tableTarget } = args;

    let relationName = "";
    if (!flags.relation) {
      relationName = `${tableOrigin}${
        tableTarget.charAt(0).toUpperCase() + tableTarget.slice(1)
      }`;
    } else relationName = flags.relation;

    let statement = "";
    let typeOfRelation: string =
      relationType.toLowerCase() === "1:m"
        ? "OneToManyRelation"
        : "ManyToManyRelation";

    if (typeOfRelation === "OneToManyRelation") {
      statement = `${chalk.grey(
        `\nCreate column-relation ${typeOfRelation}`
      )} ${chalk.blue(`"${relationName}`)} ${chalk.grey("in")} ${chalk.blue(
        `"${tableTarget}"`
      )} ${chalk.grey("table ")}`;
      cli.action.start(`${statement}`, "initializing", { stdout: true });
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum[typeOfRelation],
            migration: {
              name: relationName,
              one: { table: tableOrigin },
              many: { table: tableTarget },
              nullable: true,
              onUpdate: "SET NULL",
              onDelete: "SET NULL"
            }
          }
        ]
      });
    } else if (typeOfRelation === "ManyToManyRelation") {
      statement = `${chalk.grey(
        `\nCreate tableJunction ${typeOfRelation}`
      )} ${chalk.blue(`"${relationName}"`)} ${chalk.grey("for")} ${chalk.blue(
        `"${tableOrigin}"`
      )} ${chalk.grey("and")} ${chalk.blue(`"${tableTarget}`)} ${chalk.grey(
        "table "
      )}`;
      cli.action.start(`${statement}`, "initializing", { stdout: true });
      await client.migrate({
        operations: [
          {
            operation: V1MigrateOperationsOperationEnum.Create,
            resource: V1MigrateOperationsResourceEnum[typeOfRelation],
            migration: {
              name: relationName,
              origin: { table: tableOrigin },
              target: { table: tableTarget },
              nullable: true,
              onUpdate: "SET NULL",
              onDelete: "SET NULL"
            }
          }
        ]
      });
    }

    cli.action.stop(`${chalk.green("\nSuccess\n\n")}`);
  }
}
