import axios from "axios";

const api = axios.create({
  baseURL: "https://ssw.inf.br/api",
});

export default api;
