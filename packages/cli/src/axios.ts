import axios from "axios";
import config from "./config";

axios.defaults.baseURL = "https://qore-api.feedloop.io";
const token = config.get("token");
if (token) {
  axios.defaults.headers["Authorization"] = `Bearer ${token}`;
}

export default axios;
