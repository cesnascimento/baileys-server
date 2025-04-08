import express from "express";
import router from "./routes/index";

const app = express();
app.use(express.json());
app.use("/", router);

app.listen(3001, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
