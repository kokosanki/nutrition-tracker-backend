import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";
import { describe, it, expect } from "vitest";

function buildApp() {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  });

  const app = express();
  app.post("/test", limiter, (req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("rate limiter", () => {
  it("allows requests up to the limit, then blocks with 429", async () => {
    const app = buildApp();

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/test");
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post("/test");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe(
      "Too many login attempts, please try again later",
    );
  });
});
