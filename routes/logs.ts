import { Router, Request, Response } from "express";
import pool from "../db";
import authenticate from "../middleware/authenticate";
import type { MealType } from "@/constants/mealTypes.ts";
import { isMealType } from "@/constants/mealTypes.ts";

const router = Router();

interface LogFoodBody {
  name: string;
  offId?: string;
  serving?: string | null;
  caloriesPer100g: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  amount: number;
  loggedDate: string;
  mealType: MealType;
}

interface LoggedFood extends LogFoodBody {
  id: number;
}

const rowToLoggedFood = (row: any): LoggedFood => {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    mealType: row.meal_type,
    name: row.name,
    offId: row.off_id,
    serving: row.serving,
    amount: Number(row.amount),
    caloriesPer100g:
      row.calories_per_100g != null ? Number(row.calories_per_100g) : null,
    proteinPer100g:
      row.protein_per_100g != null ? Number(row.protein_per_100g) : null,
    carbsPer100g:
      row.carbs_per_100g != null ? Number(row.carbs_per_100g) : null,
    fatPer100g: row.fat_per_100g != null ? Number(row.fat_per_100g) : null,
  };
};

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      name,
      offId,
      serving,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      amount,
      loggedDate,
      mealType,
    } = req.body as LogFoodBody;

    if (
      !name ||
      !loggedDate ||
      !mealType ||
      !amount ||
      caloriesPer100g == null
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO logged_foods
        (user_id, logged_date, meal_type, name, off_id, serving, amount,
         calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.userId,
        loggedDate,
        mealType,
        name,
        offId ?? null,
        serving ?? null,
        amount,
        caloriesPer100g,
        proteinPer100g ?? null,
        carbsPer100g ?? null,
        fatPer100g ?? null,
      ],
    );

    res.status(201).json({ loggedFood: rowToLoggedFood(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong logging this food" });
  }
});

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const date = req.query.date;

    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: 'Query parameter "date" is required' });
    }

    const result = await pool.query(
      `SELECT
        id, logged_date::text AS logged_date, meal_type,
        name, off_id, serving, amount,
        calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
        created_at
       FROM logged_foods
       WHERE user_id = $1 AND logged_date = $2
       ORDER BY created_at ASC`,
      [req.userId, date],
    );

    res.json({ loggedFoods: result.rows.map(rowToLoggedFood) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong fetching logs" });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      `DELETE FROM logged_foods WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Logged food not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong deleting this log' });
  }
});

interface UpdateLogBody {
  amount?: number;
  mealType?: string;
  loggedDate?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value: string): boolean => {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { amount, mealType, loggedDate } = req.body as UpdateLogBody;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid log id' });
    }

    if (amount === undefined && mealType === undefined && loggedDate === undefined) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }

    if (amount !== undefined && !(amount > 0)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    if (mealType !== undefined && !isMealType(mealType)) {
      return res.status(400).json({ error: 'Invalid mealType' });
    }

    if (loggedDate !== undefined && !isValidDateString(loggedDate)) {
      return res.status(400).json({ error: 'loggedDate must be a valid YYYY-MM-DD date' });
    }

    const setClauses: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      values.push(amount);
    }
    if (mealType !== undefined) {
      setClauses.push(`meal_type = $${paramIndex++}`);
      values.push(mealType);
    }
    if (loggedDate !== undefined) {
      setClauses.push(`logged_date = $${paramIndex++}`);
      values.push(loggedDate);
    }

    values.push(id, req.userId!);

    const result = await pool.query(
      `UPDATE logged_foods
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Logged food not found' });
    }

    res.json({ loggedFood: rowToLoggedFood(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong updating this log' });
  }
});

export default router;
