require("dotenv").config();
const express = require("express");
const pool = require("./db");
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authenticate = require('./middleware/authenticate');

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
