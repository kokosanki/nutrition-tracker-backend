import { Router, Request, Response } from "express";
import pool from "../db";
import authenticate from "../middleware/authenticate";
import type { MealType } from "@/constants/mealTypes.ts";

const router = Router();

interface LogFoodBody {
  name: string;
  offId?: string;
  serving?: string | null;
  caloriesPer100g: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  amountGrams: number;
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
    amountGrams: Number(row.amount_grams),
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
      amountGrams,
      loggedDate,
      mealType,
    } = req.body as LogFoodBody;

    if (
      !name ||
      !loggedDate ||
      !mealType ||
      !amountGrams ||
      caloriesPer100g == null
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO logged_foods
        (user_id, logged_date, meal_type, name, off_id, serving, amount_grams,
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
        amountGrams,
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
        name, off_id, serving, amount_grams,
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

export default router;
