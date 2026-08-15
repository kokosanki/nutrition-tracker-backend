import { Router, Request, Response } from "express";
import pool from "../db";
import authenticate from "../middleware/authenticate";

const router = Router();

interface WaterLog {
  id: number;
  userId: number;
  loggedDate: string;
  amountMl: number;
  loggedAt: string;
}

interface LogWaterBody {
  loggedDate: string;
  amountMl: number;
}

interface ErrorResponse {
  error: string;
}

const rowToWaterLog = (row: any): WaterLog => {
  return {
    id: row.id,
    userId: row.user_id,
    loggedDate: row.logged_date,
    amountMl: Number(row.amount_ml),
    loggedAt: row.logged_at,
  };
};

router.post(
  "/",
  authenticate,
  async (
    req: Request<{}, {}, LogWaterBody>,
    res: Response<{ waterLog: WaterLog } | ErrorResponse>,
  ) => {
    try {
      const { loggedDate, amountMl } = req.body;

      if (!loggedDate || !amountMl) {
        return res
          .status(400)
          .json({ error: "loggedDate and amountMl are required" });
      }

      const result = await pool.query(
        `INSERT INTO water_logs (user_id, logged_date, amount_ml)
   VALUES ($1, $2, $3)
   RETURNING id, user_id, logged_date::text AS logged_date, amount_ml, logged_at`,
        [req.userId, loggedDate, amountMl],
      );

      res.status(201).json({ waterLog: rowToWaterLog(result.rows[0]) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong logging water" });
    }
  },
);

router.get(
  "/",
  authenticate,
  async (
    req: Request<{}, {}, {}, { date?: string }>,
    res: Response<{ waterLogs: WaterLog[] } | ErrorResponse>,
  ) => {
    try {
      const date = req.query.date;

      if (!date || typeof date !== "string") {
        return res
          .status(400)
          .json({ error: 'Query parameter "date" is required' });
      }

      const result = await pool.query(
        `SELECT id, user_id, logged_date::text AS logged_date, amount_ml, logged_at
       FROM water_logs
       WHERE user_id = $1 AND logged_date = $2
       ORDER BY logged_at ASC`,
        [req.userId, date],
      );

      res.json({ waterLogs: result.rows.map(rowToWaterLog) });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Something went wrong fetching water logs" });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  async (
    req: Request<{ id: string }>,
    res: Response<ErrorResponse | undefined>,
  ) => {
    try {
      const id = req.params.id;

      const result = await pool.query(
        `DELETE FROM water_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, req.userId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Water log not found" });
      }

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Something went wrong deleting this water log" });
    }
  },
);

export default router;
