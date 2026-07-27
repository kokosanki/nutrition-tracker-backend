import "dotenv/config";
import express from "express";
import pool from "./db";
import authRoutes from "./routes/auth";
import foodRoutes from './routes/foods';
import logRoutes from './routes/logs';
import cookieParser from "cookie-parser";
import cors from "cors";
import authenticate from "./middleware/authenticate";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use('/auth', authRoutes);
app.use('/foods', foodRoutes)
app.use('/logs', logRoutes);

app.get("/test-items", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM test_items");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
