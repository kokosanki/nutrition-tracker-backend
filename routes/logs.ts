import { Router, Request, Response } from "express";
import pool from "../db";
import authenticate from "../middleware/authenticate";

const router = Router();

interface LogFoodBody {
  loggedDate: string;
  mealType: string;
  productName: string;
  offId?: string;
  amountGrams: number;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      loggedDate,
      mealType,
      productName,
      offId,
      amountGrams,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
    } = req.body as LogFoodBody;

    if (
      !loggedDate ||
      !mealType ||
      !productName ||
      !amountGrams ||
      caloriesPer100g == null
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const scale = amountGrams / 100;
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const calories = round2(caloriesPer100g * scale);
    const protein =
      proteinPer100g != null ? round2(proteinPer100g * scale) : null;
    const carbs = carbsPer100g != null ? round2(carbsPer100g * scale) : null;
    const fat = fatPer100g != null ? round2(fatPer100g * scale) : null;

    const result = await pool.query(
      `INSERT INTO logged_foods
        (user_id, logged_date, meal_type, product_name, off_id, amount_grams, calories, protein, carbs, fat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.userId,
        loggedDate,
        mealType,
        productName,
        offId ?? null,
        amountGrams,
        calories,
        protein,
        carbs,
        fat,
      ],
    );

    res.status(201).json({ loggedFood: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong logging this food" });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const date = req.query.date;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Query parameter "date" is required' });
    }

    const result = await pool.query(
      `SELECT
        id,
        logged_date::text AS logged_date,
        meal_type,
        product_name,
        off_id,
        amount_grams,
        calories,
        protein,
        carbs,
        fat,
        created_at
       FROM logged_foods
       WHERE user_id = $1 AND logged_date = $2
       ORDER BY created_at ASC`,
      [req.userId, date]
    );

    res.json({ loggedFoods: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching logs' });
  }
});

export default router;
