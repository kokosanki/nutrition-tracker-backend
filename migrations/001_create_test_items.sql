CREATE TABLE test_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO test_items (name) VALUES ('hello world');

SELECT * FROM test_items;