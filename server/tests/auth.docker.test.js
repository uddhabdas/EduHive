const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const authRoutes = require("../src/routes/auth");
const { auth } = require("../src/middleware/auth");

let app;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);

  app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);

  app.get("/api/me", auth, (req, res) => {
    res.json({ email: req.user.email, id: req.user.id });
  });
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});

test("health works", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});

test("register -> login -> me", async () => {
  const email = "test@example.com";
  const password = "secret123";

  const reg = await request(app).post("/api/auth/register").send({ email, password });
  expect([200, 201]).toContain(reg.status);
  expect(reg.body.token).toBeTruthy();

  const login = await request(app).post("/api/auth/login").send({ email, password });
  expect(login.status).toBe(200);
  const token = login.body.token;

  const me = await request(app)
    .get("/api/me")
    .set("Authorization", `Bearer ${token}`);
  expect(me.status).toBe(200);
  expect(me.body.email).toBe(email);
});
