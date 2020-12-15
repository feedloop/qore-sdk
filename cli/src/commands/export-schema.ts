import { Command, flags } from "@oclif/command";
import prettier from "prettier";
import createProject, {
  FieldType,
  Table,
  Vield,
  ViewSummary,
} from "@qore/sdk/lib/project/index";
import fs from "fs";
import path from "path";
import { CLIConfig } from "../config";
import { configFlags, promptFlags } from "../flags";
import { QoreSchema, TableSchema, ViewSchema } from "../types";
/**
 * urutan field:
 * 1. primitive
 * 2. relation
 * 3. lookup
 * 4. rollup
 * 5. formula
 *  */

const fieldOrder: FieldType[] = ["relation", "lookup", "rollup", "formula"];

export default class ExportSchema extends Command {
  static description = "export the schema of a given project";

  static examples = [`$ qore `];

  static flags = {
    ...configFlags,
  };

  static args = [{ name: "file" }];

  static async getSchema(configs: CLIConfig): Promise<QoreSchema> {
    const project = createProject({
      organizationId: configs.org,
      projectId: configs.project,
      token: configs.token,
    });
    const tables = await project.tables();
    const tablesSchema: TableSchema[] = await Promise.all(
      tables.map(
        async (table): Promise<TableSchema> => {
          const fields = await table.fields();
          const tableForms = await table.forms();
          const forms = await Promise.all(
            tableForms.map(async (form) => {
              return table.form(form.id);
            })
          );
          return {
            id: table.id,
            name: table.name,
            type: table.type,
            master: table.master,
            fields,
            forms,
          };
        }
      )
    );
    const views = await project.views();
    const viewsSchema: ViewSchema[] = await Promise.all(
      views.map(
        async (view): Promise<ViewSchema> => {
          const vields = await view.vields();
          const {
            filter,
            id,
            name,
            parameters,
            sorts,
            tableId,
          } = await project.view(view.id);
          return {
            id,
            filter,
            name,
            sorts,
            parameters,
            tableId,
            vields,
          };
        }
      )
    );
    const schema: QoreSchema = {
      version: "v1",
      tables: tablesSchema,
      views: viewsSchema,
    };
    return schema;
  }

  async run() {
    const { args, flags } = this.parse(ExportSchema);
    const configs = await promptFlags(flags, ExportSchema.flags);
    const schema = await ExportSchema.getSchema(configs);
    fs.writeFileSync(
      path.resolve(process.cwd() + "/qore-schema.json"),
      prettier.format(JSON.stringify(schema), { parser: "json" }),
      {
        encoding: "utf8",
      }
    );
  }
}
