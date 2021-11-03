import { Configuration, DefaultApi } from "@feedloop/qore-sdk";
import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import chalk from "chalk";

function getListCol(input) {
  let result = {};
  for (let key in input) {
    if (key.toLocaleLowerCase() !== "id") {
      result[key] = { minWidth: 7 };
    }
  }
  result.id = {
    header: "ID",
    extended: true
  };
  return result;
}

export default class Select extends Command {
  static description = "Get all rows from  a specific table";
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
    const { data } = await client.getRows(argv[0]);
    const rowData = data.items;
    const listCol = getListCol(rowData[0]);
    console.log(`${chalk.green("List rows:")}`);
    cli.table(rowData, listCol, {
      printLine: this.log,
      ...flags
    });
  }
}
