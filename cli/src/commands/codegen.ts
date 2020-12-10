import { Command, flags } from "@oclif/command";
import voca from "voca";
import prettier from "prettier";
import Wonka from "wonka";
import { Field } from "@qore/sdk";
import fs from "fs";
import path from "path";
import createProject, {
  FieldType,
  Table,
  Vield,
  ViewSummary,
} from "@qore/sdk/lib/project/index";
import config from "../config";

export default class Codegen extends Command {
  static description = "Generate typescript definition file";

  static examples = [`$ qore codegen --project projectId --org orgId`];

  static flags = {
    project: flags.string({ description: "project id", required: true }),
    org: flags.string({ description: "oranization id", required: true }),
    token: flags.string({ description: "token" }),
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
    "relation",
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
      const token = flags.token || config.get("accessToken");
      if (!flags.org || !flags.project || !token)
        throw new Error("Unauthorized");
      const project = createProject({
        organizationId: flags.org,
        projectId: flags.project,
        token,
      });

      const tables = await project.tables();
      const tablesWithFields = await Promise.all(
        tables.map(async (table) => {
          const fields = await table.fields();
          return { table, fields };
        })
      );

      const views = await project.views();
      const viewsWithFields = await Promise.all(
        views.map(async (view) => {
          const detailView = await project.view(view.id);
          const vields = await view.vields();
          return { view, detailView, vields };
        })
      );
      const idField = { id: "id", type: "text", name: "id" } as Field<"text">;
      const typeDef = `
      ${tablesWithFields
        .map(
          ({ table, fields }) => `
            type ${voca.capitalize(table.id)}TableRow = {${[idField, ...fields]
            .map(
              (field) => `
            ${field.id}: ${this.readFieldType(field)};`
            )
            .join("")}}`
        )
        .join("\n")}

    ${viewsWithFields
      .map(
        ({ view, vields, detailView }) => `
          type ${voca.capitalize(view.id)}ViewRow = {
            read: {${[idField, ...vields]
              .map(
                (field) => `
            ${field.id}: ${this.readFieldType(field)};`
              )
              .join("")}}
            write: {${vields
              .filter((vield) => this.isWriteField(vield))
              .map(
                (field) => `
                ${field.id}: ${this.writeFieldType(field)};`
              )
              .join("")}
            }
            params: {${detailView.parameters
              .map(
                (param) => `
                ${param.slug}${param.required ? "" : "?"}: ${
                  param.type === "text" ? "string" : "number"
                };`
              )
              .join("")}
              ${detailView.sorts
                .filter((sort) => !!sort.order && !!sort.by)
                // group order by "sort.by"
                .reduce((group, sort) => {
                  const targetIdx = group.findIndex(
                    (sortGroup) => sortGroup.by === sort.by
                  );
                  if (group[targetIdx]) {
                    group[targetIdx].order.push(sort.order);
                  } else {
                    group.push({
                      by: sort.by,
                      order: [sort.order],
                    });
                  }
                  return group;
                }, [] as Array<{ by: string; order: string[] }>)
                .map(
                  (sortGroup) =>
                    `"$by.${sortGroup.by}"?: ${sortGroup.order
                      .map((order) => `"${order}"`)
                      .join("|")};`
                )
                .join("")}
            }
          }`
      )
      .join("\n")}

      export type QoreProjectSchema = {
        ${viewsWithFields
          .map(({ view }) => `${view.id}: ${voca.capitalize(view.id)}ViewRow;`)
          .join("")}
      }
    `;
      fs.writeFileSync(
        path.resolve(process.cwd() + "/qore-generated.ts"),
        prettier.format(typeDef, { parser: "babel-ts" }),
        {
          encoding: "utf8",
        }
      );
    } catch (error) {
      console.error(error.message);
    }
  }
}
