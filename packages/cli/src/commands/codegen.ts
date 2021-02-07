import { Command, flags } from "@oclif/command";
import voca from "voca";
import prettier from "prettier";
import { Field } from "@feedloop/qore-sdk";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import makeProject, {
  APIField,
  FieldType,
  Vield
} from "@feedloop/qore-sdk/lib/project/index";
import config, { CLIConfig } from "../config";
import ExportSchema from "./export-schema";
import { configFlags, promptFlags } from "../flags";
import { string } from "@oclif/command/lib/flags";

export type QoreRC = {
  version: string;
  endpoint: string;
  projectId: string;
  organizationId: string;
  authenticationId?: string;
};

export default class Codegen extends Command {
  static warningMessage =
    "[WARNING] This file is generated by running `$ qore codegen` on your root project, please do not edit";
  static description = "Generate qore project files";

  static examples = [`$ qore codegen --project projectId --org orgId`];

  static flags = {
    ...configFlags,
    path: flags.string({
      name: "path",
      description: "path",
      default: () => "./"
    })
  };

  static loadRc = async (destination: string) => {
    try {
      const qoreConfig: QoreRC = await fse.readJSON(destination);
      return qoreConfig;
    } catch (error) {
      return null;
    }
  };

  static loadConfigFromRc = async (
    destination: string
  ): Promise<{ project: string; org: string } | null> => {
    const rc = await Codegen.loadRc(destination);
    if (!rc) return null;
    return { project: rc.projectId, org: rc.organizationId };
  };

  static writeConfigFile = async (configs: CLIConfig, destination?: string) => {
    const project = makeProject({
      organizationId: configs.org,
      projectId: configs.project
    });
    await project.auth.signInWithUserToken(configs.token);
    const authConfig = await project.authConfig();
    fse.writeJSONSync(
      path.resolve(destination || process.cwd(), "qore.config.json"),
      {
        version: "v1",
        endpoint: "https://prod-qore-app.qorebase.io",
        projectId: configs.project,
        organizationId: configs.org,
        authenticationId: authConfig.password?.id,
        WARNING: Codegen.warningMessage
      },
      { spaces: 2 }
    );
  };

  private writeFieldTypes = new Set<FieldType>([
    "text",
    "number",
    "date",
    "file",
    "password",
    "select",
    "boolean",
    "select",
    "relation"
  ]);

  readFieldType(field: APIField) {
    switch (field.type) {
      case "text":
      case "file":
      case "password":
        return "string";
      case "role":
        return "{id: string; displayField: string}";
      case "relation":
        if (field.multiple)
          return `{nodes: ${voca.capitalize(
            field.id === "person" ? "member" : field.id
          )}TableRow[]}`;
        return `${voca.capitalize(
          field.id === "person" ? "member" : field.id
        )}TableRow${field.multiple ? "[]" : ""}`;
      case "rollup":
        return "number";
      case "date":
        return "Date";
      case "select":
        return field.select.map(select => `"${select}"`).join("|");
      case "lookup":
      case "formula":
        if (field.returnType === "table")
          return "{id: string; displayField: string}";
        if (field.returnType === "text") return "string";
        return field.returnType;
      default:
        return field.type;
    }
  }
  writeFieldType(field: APIField) {
    switch (field.type) {
      case "text":
      case "file":
      case "password":
      case "role":
        return "string";
      case "relation":
        return "string[]";
      case "date":
        return "Date";
      case "select":
        return field.select.map(select => `"${select}"`).join("|");
      default:
        return field.type;
    }
  }
  isWriteField(field: APIField) {
    return this.writeFieldTypes.has(field.type);
  }

  async run() {
    try {
      const { args, flags } = this.parse(Codegen);
      const destination = path.resolve(process.cwd(), flags.path);
      const loadedConfig = await Codegen.loadConfigFromRc(destination);
      const configs = await promptFlags(
        {
          ...(loadedConfig || {}),
          ...flags
        },
        Codegen.flags
      );
      const schema = await ExportSchema.getSchema(configs);
      await ExportSchema.run([
        "--project",
        configs.project,
        "--org",
        configs.org,
        "--token",
        configs.token,
        "--path",
        flags.path
      ]);
      const idField = { id: "id", type: "text", name: "id" } as Field<"text">;

      const typeDef = `
      // ${Codegen.warningMessage}

      /// <reference types="@feedloop/qore-client" />
      import { QoreSchema } from "@feedloop/qore-client";

      declare module "@feedloop/qore-client" {
        ${schema.tables
          .map(
            ({ id, fields }) => `
              type ${voca.capitalize(id)}TableRow = {${[idField, ...fields]
              .filter(field => field.type !== "action")
              .map(
                field => `
              ${field.id}: ${this.readFieldType(field)};`
              )
              .join("")}}`
          )
          .join("\n")}

        ${schema.views
          .map(({ id, parameters, sorts, fields, tableId }) => {
            const table = schema.tables.find(t => t.id === tableId);
            const getFieldType = (fieldId: string): APIField => {
              const field = table?.fields.find(field => field.id === fieldId);
              if (!field) throw new Error(`Field not found from ${table?.id}`);
              return field;
            };
            return `
              type ${voca.capitalize(id)}ViewRow = {
                read: {${[idField, ...fields]
                  .filter(field => field.type !== "action")
                  .map(
                    field => `
                ${field.id}: ${this.readFieldType(field)};`
                  )
                  .join("")}}
                write: {${fields
                  .filter(vield => this.isWriteField(vield))
                  .map(
                    field => `
                    ${field.id}: ${this.writeFieldType(field)};`
                  )
                  .join("")}
                }
                params: {${parameters
                  .map(
                    param => `
                    ${param.slug}${param.required ? "" : "?"}: ${
                      param.type === "text" ? "string" : "number"
                    };`
                  )
                  .join("")}
                  ${sorts
                    .filter(sort => !!sort.order && !!sort.by)
                    // group order by "sort.by"
                    .reduce((group, sort) => {
                      const targetIdx = group.findIndex(
                        sortGroup => sortGroup.by === sort.by
                      );
                      if (group[targetIdx]) {
                        group[targetIdx].order.push(sort.order);
                      } else {
                        group.push({
                          by: sort.by,
                          order: [sort.order]
                        });
                      }
                      return group;
                    }, [] as Array<{ by: string; order: string[] }>)
                    .map(
                      sortGroup =>
                        `"$by.${sortGroup.by}"?: ${sortGroup.order
                          .map(order => `"${order}"`)
                          .join("|")};`
                    )
                    .join("")}
                }
                actions: {${fields
                  .filter(
                    (vield): vield is Field<"action"> => vield.type === "action"
                  )
                  .map(
                    action => `${action.id}: {
                    ${action.parameters.map(
                      param =>
                        `${param.slug}${!param.required && "?"}: ${
                          param.type === "text" ? "string" : param.type
                        }`
                    )}
                  }`
                  )}
                }
                forms: {${schema.forms
                  .filter(f => f.tableId === tableId)
                  .map(
                    form => `
                  ${form.id}: {${form.fields.map(
                      field => `
                        ${field.id}${
                        field.required ? "" : "?"
                      }: ${this.writeFieldType(getFieldType(field.id))}
                      `
                    )}}
                `
                  )}}
              }`;
          })
          .join("\n")}

        type ProjectSchema = {
          ${schema.views
            .map(view => `${view.id}: ${voca.capitalize(view.id)}ViewRow;`)
            .join("")}
        }
      }
    `;
      fs.writeFileSync(
        path.resolve(destination, "qore-env.d.ts"),
        prettier.format(typeDef, { parser: "babel-ts" }),
        {
          encoding: "utf8"
        }
      );
      await Codegen.writeConfigFile(configs, destination);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }
}
