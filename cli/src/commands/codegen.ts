import { Command, flags } from "@oclif/command";
import voca from "voca";
import prettier from "prettier";
import { Field } from "@qore/sdk";
import fs from "fs";
import path from "path";
import createProject, { FieldType, Vield } from "@qore/sdk/lib/project/index";
import config from "../config";
import ExportSchema from "./export-schema";
import { configFlags, promptFlags } from "../flags";

export default class Codegen extends Command {
  static description = "Generate typescript definition file";

  static examples = [`$ qore codegen --project projectId --org orgId`];

  static flags = {
    ...configFlags
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

  readFieldType(field: Field | Vield) {
    switch (field.type) {
      case "text":
        return "string";
      case "role":
        return "{id: string; displayField: string}";
      case "relation":
        return `${voca.capitalize(field.id)}TableRow${
          field.multiple ? "[]" : ""
        }`;
      case "rollup":
        return "number";
      default:
        return field.type;
    }
  }
  writeFieldType(field: Field | Vield) {
    switch (field.type) {
      case "text":
      case "role":
        return "string";
      case "relation":
        return "string[]";
      default:
        return field.type;
    }
  }
  isWriteField(field: Field | Vield) {
    return this.writeFieldTypes.has(field.type);
  }

  async run() {
    try {
      const { args, flags } = this.parse(Codegen);
      const configs = await promptFlags(flags, Codegen.flags);
      const schema = await ExportSchema.getSchema(configs);
      const idField = { id: "id", type: "text", name: "id" } as Field<"text">;
      const typeDef = `
      ${schema.tables
        .map(
          ({ id, fields }) => `
            type ${voca.capitalize(id)}TableRow = {${[idField, ...fields]
            .map(
              field => `
            ${field.id}: ${this.readFieldType(field)};`
            )
            .join("")}}`
        )
        .join("\n")}

    ${schema.views
      .map(
        ({ id, parameters, sorts, vields }) => `
          type ${voca.capitalize(id)}ViewRow = {
            read: {${[idField, ...vields]
              .map(
                field => `
            ${field.id}: ${this.readFieldType(field)};`
              )
              .join("")}}
            write: {${vields
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
          }`
      )
      .join("\n")}

      export type QoreProjectSchema = {
        ${schema.views
          .map(view => `${view.id}: ${voca.capitalize(view.id)}ViewRow;`)
          .join("")}
      }
    `;
      fs.writeFileSync(
        path.resolve(process.cwd() + "/qore-generated.ts"),
        prettier.format(typeDef, { parser: "babel-ts" }),
        {
          encoding: "utf8"
        }
      );
    } catch (error) {
      console.error(error.message);
    }
  }
}
