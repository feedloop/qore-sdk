import { Command, flags } from "@oclif/command";
import prettier from "prettier";
import { asSequence } from "sequency";
import makeProject, {
  FieldType,
  Table,
  Vield,
  ViewSummary,
} from "@qore/sdk/lib/project/index";
import makeUser from "@qore/sdk/lib/user";
import fs from "fs";
import path from "path";
import config, { CLIConfig } from "../config";
import { configFlags, orgFlag, promptFlags, tokenFlag } from "../flags";
import { QoreSchema, TableSchema, ViewSchema } from "../types";
import { AxiosError } from "axios";

const advancedFieldsOrder: FieldType[] = [
  "relation",
  "lookup",
  "rollup",
  "formula",
];

export default class CreateProject extends Command {
  static description = "create a project from scratch or qore-schema.json";

  static examples = [`$ qore `];

  static flags = {
    token: tokenFlag,
    org: orgFlag,
    file: flags.string({
      char: "f",
      name: "file",
      description: "relative location of your qore-schema.json",
    }),
  };

  static args = [{ name: "name" }];

  async applyV1Schema(
    project: ReturnType<typeof makeProject>,
    schema: QoreSchema
  ) {
    const tableCreation = await Promise.all(
      schema.tables.map(async (table) => {
        try {
          const tableID = await project.createTable({
            name: table.name,
            master: table.master,
          });
          const createdTable = await project.table(tableID);
          await Promise.all(
            asSequence(table.fields)
              .sortedBy((field) => advancedFieldsOrder.indexOf(field.type))
              .map(async (field) => {
                await createdTable.addField(field);
              })
              .toArray()
          );
          await Promise.all(
            table.forms.map(async ({ id, ...form }) => {
              await createdTable.createForm(form);
            })
          );
          return { table };
        } catch (error) {
          let err = error as AxiosError;
          return {
            table,
            error: err.message,
            data: JSON.stringify(err.response?.data, null, 2),
            config: JSON.stringify(err.response?.config, null, 2),
          };
        }
      })
    );
    console.log({ tableCreation });
    const viewsCreation = await Promise.all(
      schema.views.map(async (view) => {
        try {
          const viewId = await project.createView({
            name: view.name,
            parameters: view.parameters,
            filter: view.filter,
            sorts: view.sorts,
            tableId: view.tableId,
            vields: view.vields.map((v) => v.id),
          });
          return { view };
        } catch (error) {
          console.log(error.response.config);
          return {
            view,
            error: error.message,
            data: error.response.data.message,
          };
        }
      })
    );
    console.log({ viewsCreation });
  }

  async run() {
    const { args, flags } = this.parse(CreateProject);
    const configs = await promptFlags(flags, CreateProject.flags);
    const user = makeUser();
    user.setToken(configs.token);
    const org = await user.organization(configs.org);
    const newProjectID = await org.createProject({
      name: args["name"] || "New project",
    });
    config.set("project", newProjectID);
    const project = makeProject({
      organizationId: configs.org,
      projectId: newProjectID,
    });
    await project.auth.signInWithUserToken(configs.token);
    if (configs.file) {
      try {
        const schema: QoreSchema = JSON.parse(
          fs.readFileSync(path.resolve(process.cwd() + "/" + configs.file), {
            encoding: "utf8",
          })
        );
        await this.applyV1Schema(project, schema);
      } catch (error) {
        throw error;
      }
    }
    this.log(`Created project: ${newProjectID}`);
  }
}
