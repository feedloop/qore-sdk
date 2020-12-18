export type UrlParam = {
  organizationId: string;
  projectId: string;
  roleId: string;
  memberId: string;
  workflowId: string;
  tableId: string;
  viewId: string;
  formId: string;
  rowId: string;
  fieldId: string;
  refRowId: string;
  projectAuthId: string;
};

export const url = {
  project(params: Pick<UrlParam, "organizationId" | "projectId">) {
    return `/orgs/${params.organizationId}/projects/${params.projectId}`;
  },
  authConfig(
    params: Partial<Pick<UrlParam, "projectAuthId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    if (!params.projectAuthId) return url.project(params) + "/authConfig";
    return url.project(params) + "/authConfig/" + params.projectAuthId;
  },
  view(
    params: Partial<Pick<UrlParam, "viewId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    if (!params.viewId) return url.project(params) + "/views";
    return url.project(params) + "/views/" + params.viewId;
  },
  form(
    params: Partial<Pick<UrlParam, "formId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    if (!params.formId) return url.project(params) + "/forms";
    return url.project(params) + "/forms/" + params.formId;
  },
  workflow(
    params: Partial<Pick<UrlParam, "workflowId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    if (!params.workflowId) return url.project(params) + "/workflows";
    return url.project(params) + "/workflows/" + params.workflowId;
  },
  table(
    params: Partial<Pick<UrlParam, "tableId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    if (!params.tableId) return url.project(params) + "/tables";
    return url.project(params) + "/tables/" + params.tableId;
  },
  field(
    params: Partial<Pick<UrlParam, "fieldId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "tableId">
  ) {
    const tableUrl = url.table(params);
    const fieldUrl = tableUrl + "/fields";
    if (!params.fieldId) return fieldUrl;
    return fieldUrl + "/" + params.fieldId;
  },
  vield(
    params: Partial<Pick<UrlParam, "fieldId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "viewId">
  ) {
    const viewUrl = url.view(params);
    const fieldUrl = viewUrl + "/fields";
    if (!params.fieldId) return fieldUrl;
    return fieldUrl + "/" + params.fieldId;
  },
  reorderVieldAfter(
    params: Partial<Pick<UrlParam, "fieldId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "viewId"> & {
        afterFieldId: string;
      }
  ) {
    const viewUrl = url.view(params);
    const fieldUrl = viewUrl + "/fields";
    return fieldUrl + "/" + params.fieldId + "/reorder/" + params.afterFieldId;
  },
  row(
    params: Partial<Pick<UrlParam, "rowId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "tableId">
  ) {
    const viewUrl = url.table(params);
    const rowUrl = viewUrl + "/rows";
    if (!params.rowId) return rowUrl;
    return rowUrl + "/" + params.rowId;
  },
  rowCount(
    params: Partial<Pick<UrlParam, "rowId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "tableId">
  ) {
    const viewUrl = url.table(params);
    const rowUrl = viewUrl + "/rows/count";
    if (!params.rowId) return rowUrl;
    return rowUrl + "/" + params.rowId;
  },
  vrow(
    params: Partial<Pick<UrlParam, "rowId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "viewId">
  ) {
    const viewUrl = url.view(params);
    const rowUrl = viewUrl + "/v2rows";
    if (!params.rowId) return rowUrl;
    return rowUrl + "/" + params.rowId;
  },
  vrowCount(
    params: Partial<Pick<UrlParam, "rowId">> &
      Pick<UrlParam, "organizationId" | "projectId" | "viewId">
  ) {
    const viewUrl = url.view(params);
    const rowUrl = viewUrl + "/v2rows/count";
    if (!params.rowId) return rowUrl;
    return rowUrl + "/" + params.rowId;
  },
  addRowRelation(
    params: Pick<
      UrlParam,
      "organizationId" | "projectId" | "tableId" | "fieldId" | "rowId"
    >
  ) {
    const tableUrl = url.table(params);
    return tableUrl + "/rows/" + params.rowId + "/relation/" + params.fieldId;
  },
  executeRow(
    params: Pick<
      UrlParam,
      "organizationId" | "projectId" | "tableId" | "fieldId" | "rowId"
    >
  ) {
    const tableUrl = url.table(params);
    return tableUrl + "/rows/" + params.rowId + "/action/" + params.fieldId;
  },
  removeRowRelation(
    params: Pick<
      UrlParam,
      | "organizationId"
      | "projectId"
      | "tableId"
      | "fieldId"
      | "rowId"
      | "refRowId"
    >
  ) {
    const tableUrl = url.table(params);
    return (
      tableUrl +
      "/rows/" +
      params.rowId +
      "/relation/" +
      params.fieldId +
      "/" +
      params.refRowId
    );
  },
  projectLogin(params: Pick<UrlParam, "organizationId" | "projectId">) {
    return url.project(params) + "/authenticate";
  },
  member(
    params: Partial<Pick<UrlParam, "memberId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    return !params.memberId
      ? url.project(params) + "/members"
      : url.project(params) + "/members/" + params.memberId;
  },
  role(
    params: Partial<Pick<UrlParam, "roleId">> &
      Pick<UrlParam, "organizationId" | "projectId">
  ) {
    return !params.roleId
      ? url.project(params) + "/roles"
      : url.project(params) + "/roles/" + params.roleId;
  },
  sandbox(params: Pick<UrlParam, "organizationId" | "projectId">) {
    return url.project(params) + "/sandbox";
  }
};
