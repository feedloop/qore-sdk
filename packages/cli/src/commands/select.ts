import {
  Configuration,
  DefaultApi,
  V1ExecuteOperationsOperationEnum
} from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import chalk from "chalk";

function getListCol(input: object[]) {
  let result = {};
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
  static description = "Get all rows from a specific table";
  static examples = [`$ qore select tableName`];
  static args = [{ name: "table name" }];
  static flags = {
    apiKey: flags.string({ description: "apiKey" }),
    ...cli.table.flags()
  };

  async run() {
    const { argv, flags } = this.parse(Select);
    const client = new DefaultApi(
      new Configuration({ apiKey: `${flags.apiKey}` })
    );

    const table = argv[0];
    const name = "select" + table.charAt(0).toUpperCase() + table.slice(1);
    const { data } = await client.execute({
      operations: [
        {
          operation: V1ExecuteOperationsOperationEnum.Select,
          instruction: {
            table,
            name,
            condition: {},
            populate: []
          }
        }
      ]
    });
    const rowData = data.results[name];
    const listCol = getListCol(rowData);
    console.log(`${chalk.green("List rows:")}`);
    cli.table(rowData, listCol, {
      printLine: this.log,
      ...flags
    });
  }
}
