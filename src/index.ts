import express, { Request, Response } from "express";
import notesRouter from "./services/notes/notesRouter";
import categoryRouter from "./services/categories/categoryRouter";
import responsesRouter from "./services/responces/responceRouter";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is running..." });
});

app.use("/notes", notesRouter);
app.use("/categories", categoryRouter);
app.use("responses", responsesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
