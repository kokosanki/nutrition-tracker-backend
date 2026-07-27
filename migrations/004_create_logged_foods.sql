CREATE TABLE logged_foods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  logged_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  off_id TEXT,
  amount_grams NUMERIC NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);