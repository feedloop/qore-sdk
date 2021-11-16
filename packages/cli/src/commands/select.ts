import {
  Configuration,
  DefaultApi,
  V1ExecuteOperationsOperationEnum
} from "@feedloop/qore-sdk";
import { Command } from "@oclif/command";
import { cli } from "cli-ux";
import chalk from "chalk";
import config from "../config";

interface Result {
  [key: string]: {
    [key: string]: string | number | boolean;
  };
}

function getListCol(input: Object[]) {
  let result: Result = {};
  for (let key in input[0]) {
    result[key] = { minWidth: 7 };
  }
  result.id = {
    header: "ID",
    extended: true
  };
  return result;
}

export default class Select extends Command {
  static description = "Get all rows from specific table";

  static examples = [`$ qore select tableName`];

  static args = [{ name: "tableName" }];

  static flags = {
    ...cli.table.flags()
  };

  async run() {
    const { args, flags } = this.parse(Select);
    const { tableName } = args;
    const client = new DefaultApi(
      new Configuration({ apiKey: config.get("apiKey") })
    );

    this.log(`\n${chalk.blue(`${tableName.toUpperCase()}`)}\n`);

    const identityName =
      "select" + tableName.charAt(0).toUpperCase() + tableName.slice(1);
    const { data } = await client.execute({
      operations: [
        {
          operation: V1ExecuteOperationsOperationEnum.Select,
          instruction: {
            table: tableName,
            name: identityName,
            condition: {},
            populate: []
          }
        }
      ]
    });

    const rowData = data.results[identityName];
    const listCol = getListCol(rowData);
    cli.table(rowData, listCol, {
      printLine: this.log,
      ...flags
    });
  }
}
