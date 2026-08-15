CREATE TABLE water_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  logged_date DATE NOT NULL,
  amount_ml NUMERIC NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);