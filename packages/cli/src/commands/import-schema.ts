import { DefaultApi, Configuration } from "@qorebase/sdk";
import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import config from "../config";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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

export default class ImportSchema extends Command {
  static description =
    "Import-schema in specific folder for other database architecture";
  static examples = [`$ qore import-schema --location`];

  static flags = {
    location: flags.string({
      char: "l",
      description: "fileLocation",
      default: "migrations"
    })
  };

  async getMigrationsDataInDB(client: any): Promise<Migrations> {
    try {
      const { data } = await client.getMigrations();
      if (!data || !data.items || data.items.length === 0) return [];
      return data.items;
    } catch (err) {
      this.error(`\n${chalk.red(`\n"${err}"`)}\n\n`);
    }
  }
  createHash(val: string): string {
    const hash = crypto.createHmac("sha512", config.get("adminSecret"));
    hash.update(val);
    return hash.digest("hex");
  }
  hashMigrations(migrations: Migrations): string[] {
    const result: string[] = [];
    migrations.forEach(v => {
      result.push(this.createHash(`${v.name} ${v.up} ${v.down}`));
    });
    return result;
  }
  async run() {
    const client = new DefaultApi(
      new Configuration({
        apiKey: config.get("adminSecret"),
        basePath: config.get("url")
      })
    );
    const { flags } = this.parse(ImportSchema);
    const location = path.resolve(path.join(process.cwd(), flags.location));
    fs.readdir(location, async (err, files) => {
      if (err) return this.error(err);
      this.log(`\n${chalk.yellow(`\nRunning import-schema`)} ...\n`);
      const migrations = await this.getMigrationsDataInDB(client);
      const operations = [];
      files.sort((a: string, b: string) => +a.split("-")[0] - +b.split("-")[0]);
      const migrationHash = this.hashMigrations(migrations);
      for (const file of files) {
        const jsonFile = await import(`${location}/${file}`);
        const {
          id,
          name,
          schema,
          description,
          createdAt,
          up,
          down,
          active
        } = jsonFile.default;
        if (!migrationHash.includes(this.createHash(`${name} ${up} ${down}`))) {
          let parsedUp = up.replace(/'/g, "''");
          let parsedDown = down.replace(/'/g, "''");
          const migrationQuery = `insert into qore_engine_migrations ("name", "description", "schema", "created_at", "up", "down", "active")
            values ('${name}', '${description}', '${JSON.stringify(
            schema
          )}', '${new Date(
            createdAt
          ).toISOString()}', '${parsedUp}', '${parsedDown}', ${active});`;
          const query = `${migrationQuery}\n${up}`;
          this.log(`${chalk.grey(`#ID-${id} - ${name}`)}`);
          try {
            await client.rawsql({ query });
          } catch (error) {
            this.log(
              `${chalk.red(`\n\nerror occured at #ID-${id} - ${name}\n\n`)}`
            );
            // @ts-ignore
            this.log(error?.response?.data?.message);
            throw error;
          }
        }
      }
      this.log(`${chalk.green("\nSuccess\n\n")}`);
    });
  }
}
