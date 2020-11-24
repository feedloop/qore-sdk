import { Command, flags } from "@oclif/command";
import voca from "voca";
import axios from "../axios";
import config from "../config";

export default class Codegen extends Command {
  static description = "Generate typescript definition file";

  static examples = [`$ qore codegen --project projectId --org orgId`];

  static flags = {
    project: flags.string({ description: "project id" }),
    org: flags.string({ description: "oranization id" }),
  };

  async run() {
    const { args, flags } = this.parse(Codegen);
    const resp = await axios.get<QORE.Schema>(
      `/orgs/${flags.org}/projects/${flags.project}/schema`
    );
    this.log(`${resp.data.tables.map(
      (table) => `
type ${voca.capitalize(table.name)}Table = {
  fields: {${table.fields
    .map(
      (field) => `
    ${field.name}: ${field.type};`
    )
    .join("")}
  }
}`
    )}
${resp.data.views.map(
  (view) => `
type ${voca.capitalize(view.name)}View = {
  table: ${voca.capitalize(view.tableId)}Table;
  fields: {${view.fields
    .map(
      (field) => `
    ${field.name}: ${field.type};`
    )
    .join("")}
  }`
)}
}`);
  }
}
