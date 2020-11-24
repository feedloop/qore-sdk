import axios from "axios";
import config from "./config";

axios.defaults.baseURL = "https://qore-api.feedloop.io";
const accessToken = config.get("accessToken");
if (accessToken) {
  axios.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
}

export default axios;
