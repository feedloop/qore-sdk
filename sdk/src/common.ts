import Axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'https://s-qore-dot-pti-feedloop.et.r.appspot.com';
export async function callApi<T>(
  params: {
    method: "get" | "post" | "put" | "delete" | "patch";
    url: string;
    data?: { [key: string]: any };
    params?: { [key: string]: any };
  },
  token?: string
) {
  const headers: { [key: string]: any } = {};
  if (token) {
    headers["Authorization"] = token;
  }
  try {
    return (await Axios({ ...params, headers, url: API_URL + params.url }))
      .data as T;
  } catch (error) {
    throw error;
    const data = error?.response?.data;
    if (error?.response?.status === 401)
      throw new UnauthorizedError("Unauthorized");
    if (data && data.errors)
      throw new Error(
        typeof data.errors === "string"
          ? data.errors
          : JSON.stringify(data.errors)
      );
    if (data) throw new Error(data);
    throw error;
  }
}

export class UnauthorizedError extends Error {}
