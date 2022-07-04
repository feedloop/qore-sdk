import { Command, flags } from "@oclif/command";
import voca from "voca";
import prettier from "prettier";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import config, { CLIConfig } from "../config";
import { configFlags, promptFlags } from "../flags";
import {
  Configuration,
  DefaultApi,
  InlineResponse2007Columns
} from "@qorebase/sdk";

const toTsType = (input: string = "") => voca.capitalize(voca.camelCase(input));

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
      description: "path"
    })
  };

  static loadRc = async (destination: string) => {
    try {
      const qoreConfig: QoreRC = await fse.readJSON(
        path.resolve(destination, "qore.config.json")
      );
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
    fse.writeJSONSync(
      path.resolve(destination || process.cwd(), "qore.config.json"),
      {
        version: "v2",
        endpoint: config.get("url"),
        WARNING: Codegen.warningMessage
      },
      { spaces: 2 }
    );
  };

  private writeFieldTypes = new Set<string>([
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

  readFieldType(field: InlineResponse2007Columns) {
    switch (field.type) {
      case "float":
      case "integer":
        return "number";
      case "text":
      case "role":
      case "password":
        return "string";
      case "array":
        return `${toTsType(field.references?.targetTable)}TableRow[]`;
      case "rollup":
        return "number";
      case "date":
      case "datetime":
        return "Date";
      case "select":
        return (field.definition?.enums as string[])
          .map(select => `"${select}"`)
          .join("|");
      case "lookup":
      case "formula":
        return field.definition?.type;
      case "file":
      case "json":
        return "Record<string, any>";
      default:
        return field.type;
    }
  }
  writeFieldType(field: InlineResponse2007Columns) {
    switch (field.type) {
      case "float":
      case "integer":
        return "number";
      case "text":
      case "file":
      case "password":
      case "role":
        return "string";
      case "array":
        return "string[]";
      case "date":
      case "datetime":
        return "Date";
      case "select":
        return (field.definition?.enums as string[])
          .map(select => `"${select}"`)
          .join("|");
      case "file":
      case "json":
        return "Record<string, any>";
      default:
        return field.type;
    }
  }
  isWriteField(field: InlineResponse2007Columns) {
    return this.writeFieldTypes.has(field.type);
  }

  async run() {
    try {
      const { args, flags } = this.parse(Codegen);
      const packageJson = await fse.readJson(
        path.resolve(process.cwd(), "package.json")
      );
      const configPath: string =
        flags.path || packageJson?.qoreconfig?.path || "";
      const destination = path.resolve(process.cwd(), configPath);

      const configs = await promptFlags(
        {
          ...flags,
          ...{ path: configPath }
        },
        Codegen.flags
      );
      const client = new DefaultApi(
        new Configuration({
          apiKey: config.get("adminSecret"),
          basePath: config.get("url")
        })
      );
      const { data: schema } = await client.getSchema();
      const idField = { id: "id", type: "text", name: "id" };

      const typeDef = `
      // ${Codegen.warningMessage}
      /// <reference types="@qorebase/client" />
      import { QoreSchema } from "@qorebase/client";
      declare module "@qorebase/client" {
        ${schema.tables
          .map(
            ({ name, columns }) => `
              type ${toTsType(name)}TableRow = {${[...columns]
              .filter(field => field.type !== "action")
              .map(
                field => `
              ${field.name}: ${this.readFieldType(field)};`
              )
              .join("")}}`
          )
          .join("\n")}
        ${schema.tables
          .map(table => {
            const getFieldType = (
              fieldId: string
            ): InlineResponse2007Columns => {
              if (fieldId === "id") return idField;
              const field = table.columns.find(field => field.name === fieldId);
              if (!field)
                throw new Error(
                  `Field ${fieldId} not found from ${table?.name}`
                );
              return field;
            };
            type Param = { name: string; type: string; enum: string[] };
            const parseParamsType = (param: Param) => {
              if (param.type === "text") return "string";
              if (param.type === "select")
                return param.enum.map(en => `"${en}"`).join("|");
              return param.type;
            };
            return table.views.map(view => {
              const id = (view.name as unknown) as string;
              const query = (view.query as unknown) as {
                fields: string[];
                registeredParams: Record<string, Param>;
              };
              const parameters = Object.values(query.registeredParams);
              const fields = query.fields.map(field => getFieldType(field));

              return `
              type ${toTsType(id)}ViewRow = {
                read: {${[...fields]
                  .filter(field => field.type !== "action")
                  .map(
                    field => `
                ${field.name}: ${this.readFieldType(field)};`
                  )
                  .join("")}}
                write: {${fields
                  .filter(vield => this.isWriteField(vield))
                  .map(
                    field => `
                    ${field.name}: ${this.writeFieldType(field)};`
                  )
                  .join("")}
                }
                params: {${parameters
                  .map(
                    param => `
                    ${param.name}: ${parseParamsType(param)};`
                  )
                  .join("")}
                }
                actions: {${fields
                  .filter(vield => vield.type === "action")
                  .map(
                    action => `${action.name}: {
                      
                    ${
                      // @ts-ignore
                      (Object.values(action.definition?.args) as Param[]).map(
                        param =>
                          `
                      ${param.name}: ${parseParamsType(param)};`
                      )
                    }
                  }`
                  )}
                }
              }`;
            });
          })
          .join("\n")}
        type ProjectSchema = {
          ${schema.tables
            .map(t => t.views)
            .reduce((all, views) => [...all, ...views], [])

            .map(
              view =>
                `${view.name}: ${toTsType(
                  (view.name as unknown) as string
                )}ViewRow;`
            )
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
      console.error(error);
      throw error;
    }
  }
}
