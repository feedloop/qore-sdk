import { DefaultApi, Configuration } from "@qorebase/sdk";
import { Command, flags } from "@oclif/command";
import config from "../config";
import chalk from "chalk";
import path from "path";
import fs from "fs";

interface Migration {
  id: number;
  name: string;
  active: boolean;
  schema: object;
  up: string;
  down: string;
  createdAt: number;
  description?: string;
}

type Migrations = Migration[];

export default class ExportSchema extends Command {
  static description = "Populate json file for all migrations process";

  static examples = [`$ qore export-schema --location migrations`];

  static flags = {
    location: flags.string({
      description: "fileLocation",
      default: "migrations"
    })
  };

  async findOrCreateLoc(location: string) {
    const isExist = fs.existsSync(location);
    if (!isExist) {
      fs.mkdirSync(location);
    }
  }

  async getDataMigrations(client: DefaultApi): Promise<Migrations> {
    const { data } = await client.getMigrations(undefined, undefined, {});
    return data.items as Migrations;
  }

  async exportFile(location: string, data: Migrations) {
    const existing = fs.readdirSync("./migrations").map(v => +v.split("-")[0]);
    let emptyCheck = true;
    data.forEach(file => {
      if (!existing.includes(file.id)) {
        emptyCheck = false;
        this.log(
          `${chalk.grey(
            `#${file.id} ${new Date(file.createdAt).toISOString()}-${file.name}`
          )}`
        );
        fs.writeFile(
          `${location}/${file.id}-${new Date(
            file.createdAt
          ).toISOString()}.json`,
          JSON.stringify(file, null, 2),
          {
            encoding: "utf8",
            flag: "w",
            mode: 0o666
          },
          err => {
            if (err) return this.error(`${chalk.red(err)}`);
          }
        );
      }
    });
    if (emptyCheck)
      this.log(
        `${chalk.green(
          "No newer migration, your migration is already up to date"
        )}`
      );
    else {
      this.log(`${chalk.grey("\n\nExport file migrations")} ...`);
      this.log(`${chalk.green("\nSuccess\n\n")}`);
    }
  }

  async run() {
    const client = new DefaultApi(
      new Configuration({
        apiKey: config.get("adminSecret"),
        basePath: config.get("url")
      })
    );
    const { flags } = this.parse(ExportSchema);
    const location = path.resolve(path.join(process.cwd(), flags.location));

    await this.findOrCreateLoc(location);
    this.log(`${chalk.yellow("\n\nRunning process")} ...\n`);
    const data = await this.getDataMigrations(client);
    await this.exportFile(location, data);
  }
}
