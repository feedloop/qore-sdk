import { Command, flags } from "@oclif/command";
import {
  DefaultApi,
  Configuration,
  MigrateRequestOperationsInnerOperationEnum,
  MigrateRequestOperationsInnerResourceEnum
} from "@qorebase/sdk";
import chalk from "chalk";
import config from "../config";
import { cli } from "cli-ux";
import inquirer from "inquirer";

interface Operation {
  operation: string;
  resource: string;
  migration: {
    name: string;
    table: string;
    column: {
      type: string;
    };
  };
}

type Types = {
  columnType:
    | "bigint"
    | "boolean"
    | "date"
    | "datetime"
    | "float"
    | "integer"
    | "json"
    | "lookup"
    | "password"
    | "text"
    | "timestamp";
};

export default class CreateColumn extends Command {
  static description = "Create new columns in specific table";

  static examples = [`$ qore create-column`];

  async run() {
    console.clear();
    const reserved = ["lookup", "password"];
    const table = await cli.prompt("Target table: ");
    const name = await cli.prompt("Column name: ");
    // uncovered : rollup
    const type: Types = await inquirer.prompt([
      {
        message: "Choose column type: ",
        name: "columnType",
        type: "list",
        choices: [
          { name: "bigint" },
          { name: "boolean" },
          { name: "date" },
          { name: "datetime" },
          { name: "float" },
          { name: "integer" },
          { name: "json" },
          { name: "lookup" },
          { name: "password" },
          { name: "text" },
          { name: "timestamp" }
        ]
      }
    ]);
    const operations = [];
    const definition: Record<string, any> = await ColumnParser[
      type.columnType
    ]();
    let defVal = "";
    let unique = false;
    let not_null = false;
    if (!reserved.includes(type.columnType)) {
      defVal = await cli.prompt("Column default value: ", {
        required: false
      });
      definition.default = defVal || null;
      const constraint = await inquirer.prompt([
        {
          type: "confirm",
          name: "unique",
          message: `Unique?`,
          default: false
        },
        {
          type: "confirm",
          name: "not_null",
          message: `Not Null?`,
          default: false
        }
      ]);
      unique = constraint.unique;
      not_null = constraint.not_null;
    }
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("adminSecret") })
    );
    operations.push({
      operation: MigrateRequestOperationsInnerOperationEnum.Create,
      resource: MigrateRequestOperationsInnerResourceEnum.Column,
      migration: {
        name,
        table,
        column: {
          type: type.columnType,
          definition
        }
      }
    });
    if (unique || not_null) {
      operations.push({
        operation: MigrateRequestOperationsInnerOperationEnum.Alter,
        resource: MigrateRequestOperationsInnerResourceEnum.Column,
        migration: {
          from: name,
          to: name,
          table,
          unique,
          not_null
        }
      });
    }
    const { confirmation } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmation",
        message: `Create column?`,
        default: true
      }
    ]);
    if (confirmation) {
      this.log(`\n${chalk.yellow("\nCreate column ")}...\n`);
      await client.migrate({ operations });
      this.log(`${chalk.green("\n\nSuccess\n\n")}`);
    }
  }
}

class ColumnParser {
  static async bigint() {
    return {};
  }
  static async boolean() {
    return {};
  }
  static async date() {
    return {};
  }
  static async datetime() {
    return {};
  }
  static async float() {
    const { precision, scale } = await inquirer.prompt([
      {
        type: "number",
        name: "precision",
        message: `Precision?`,
        default: 8
      },
      {
        type: "number",
        name: "scale",
        message: `Scale?`,
        default: 2
      }
    ]);
    return { precision, scale };
  }
  static async integer() {
    return {};
  }
  static async json() {
    return {};
  }
  static async lookup() {
    const relation = await cli.prompt("Relation name? ");
    const column = await cli.prompt("Target column name? ");
    return { relation, column };
  }
  static async password() {
    const { algorithm, salt, nullable } = await inquirer.prompt([
      {
        type: "list",
        choices: [
          { name: "sha256 (recommended)", value: "sha256" },
          { name: "sha512" }
        ],
        name: "algorithm",
        message: `Algorithm used?`,
        default: "sha256"
      },
      {
        type: "input",
        name: "salt",
        message: `Salt?`,
        default: config.get("adminSecret")
      },
      {
        type: "confirm",
        name: "nullable",
        message: `Allow null?`,
        default: true
      }
    ]);
    return { textType: "longtext", algorithm, salt, nullable };
  }
  static async text() {
    const { textType } = await inquirer.prompt([
      {
        type: "list",
        choices: [
          { name: "text" },
          { name: "mediumtext" },
          { name: "longtext" }
        ],
        name: "textType",
        message: `Text type?`,
        default: "text"
      }
    ]);
    return { textType };
  }
  static async timestamp() {
    return {};
  }
}
