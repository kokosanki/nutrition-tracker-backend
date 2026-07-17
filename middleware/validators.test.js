import express from "express";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { validateSignup } from "./validators.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/test", validateSignup, (req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("validateSignup", () => {
  it("rejects an invalid email", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "not-an-email", password: "GoodPass1!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email address");
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "Ab1!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must be 8-64 characters");
  });

  it("rejects a password missing an uppercase letter", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "lowercase1!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must contain an uppercase letter");
  });

  it("rejects a password missing a lowercase letter", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "UPPERCASE1!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must contain a lowercase letter");
  });

  it("rejects a password missing a number", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "NoNumbers!" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must contain a number");
  });

  it("rejects a password missing a special character", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "NoSpecial1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password must contain a special character");
  });

  it("accepts a valid email and password", async () => {
    const res = await request(buildApp())
      .post("/test")
      .send({ email: "user@example.com", password: "GoodPass1!" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
