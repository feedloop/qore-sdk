import Axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const API_URL = process.env.API_URL;
export async function callApi(
  params: {
    method: "get" | "post" | "put" | "delete" | "patch";
    url: string;
    data?: { [key: string]: any };
    params?: { [key: string]: any };
  },
  token?: string
) {
  const headers = {};
  if (token) {
    headers["Authorization"] = token;
  }
  try {
    return (await Axios({ ...params, headers, url: API_URL + params.url }))
      .data;
  } catch (error) {
    const data = error.response.data;
    if (data && data.errors)
      throw new Error(
        typeof data.errors === "string"
          ? data.errors
          : JSON.stringify(data.errors)
      );
    if (data) throw new Error(data);
    throw new Error("Cannot get response from server");
  }
}
