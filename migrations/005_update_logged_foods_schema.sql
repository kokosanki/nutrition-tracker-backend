ALTER TABLE logged_foods RENAME COLUMN product_name TO name;
ALTER TABLE logged_foods RENAME COLUMN calories TO calories_per_100g;
ALTER TABLE logged_foods RENAME COLUMN protein TO protein_per_100g;
ALTER TABLE logged_foods RENAME COLUMN carbs TO carbs_per_100g;
ALTER TABLE logged_foods RENAME COLUMN fat TO fat_per_100g;
ALTER TABLE logged_foods ADD COLUMN serving TEXT;