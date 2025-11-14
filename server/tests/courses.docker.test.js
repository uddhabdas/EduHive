const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const authRoutes = require("../src/routes/auth");
const coursesRoutes = require("../src/routes/courses");
const devRoutes = require("../src/routes/dev");
const { auth } = require("../src/middleware/auth");

let app;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api", coursesRoutes);
  app.use("/api", devRoutes);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});

test("seed and list courses", async () => {
  const seed = await request(app).post("/api/dev/seed");
  expect(seed.status).toBe(200);
  const list = await request(app).get("/api/courses");
  expect(list.status).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.length).toBeGreaterThanOrEqual(1);
});

test("auth flow and list lectures ordered", async () => {
  // seed
  const seed = await request(app).post("/api/dev/seed");
  const courseId = seed.body.course._id;

  // register and login
  const email = "courses_test@example.com";
  const password = "secret123";
  const reg = await request(app).post("/api/auth/register").send({ email, password });
  expect([200, 201]).toContain(reg.status);
  const login = await request(app).post("/api/auth/login").send({ email, password });
  expect(login.status).toBe(200);
  const token = login.body.token;

  // access
  const access = await request(app)
    .get(`/api/courses/${courseId}/access`)
    .set("Authorization", `Bearer ${token}`);
  expect(access.status).toBe(200);
  expect(access.body.access).toBe("unlocked");

  // lectures ordered
  const lectures = await request(app)
    .get(`/api/courses/${courseId}/lectures`)
    .set("Authorization", `Bearer ${token}`);
  expect(lectures.status).toBe(200);
  const arr = lectures.body;
  expect(Array.isArray(arr)).toBe(true);
  for (let i = 1; i < arr.length; i++) {
    expect(arr[i].orderIndex).toBeGreaterThanOrEqual(arr[i - 1].orderIndex);
  }
});
