export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export const isMealType = (value: string | undefined): value is MealType =>
  !!value && (MEAL_TYPES as readonly string[]).includes(value);
