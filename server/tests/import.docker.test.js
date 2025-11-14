const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

jest.mock("../src/services/importPlaylist", () => ({
  importPlaylist: async (playlistId) => {
    const Course = require("../src/models/Course");
    const Lecture = require("../src/models/Lecture");
    const course = await Course.create({
      title: `Demo ${playlistId}`,
      description: "Imported in test",
      thumbnailUrl: "",
      isActive: true,
      source: "youtube",
      sourcePlaylistId: playlistId,
    });
    const vids = ["vid1","vid2","vid3"]; // small fixture
    for (let i = 0; i < vids.length; i++) {
      await Lecture.create({ courseId: course._id, title: `L${i+1}`, videoId: vids[i], orderIndex: i+1, isLocked: false });
    }
    const lectures = await Lecture.find({ courseId: course._id }).sort({ orderIndex: 1 });
    return { course, lectures };
  },
}));

const authRoutes = require("../src/routes/auth");
const coursesRoutes = require("../src/routes/courses");
const devRoutes = require("../src/routes/dev");

let app;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/api/health", (_req,res)=>res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api", coursesRoutes);
  app.use("/api/dev", devRoutes);
  app.use("/api", devRoutes);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c)=>c.deleteMany({})));
});

afterAll(async () => { await mongoose.disconnect(); });

test("import playlists via dev route creates courses and lectures", async () => {
  const res = await request(app)
    .post("/api/dev/import-playlists")
    .send({ playlistIds: ["PL_TEST_A", "PL_TEST_B"] });
  expect(res.status).toBe(200);
  expect(res.body.imported).toBe(2);

  const list = await request(app).get("/api/courses");
  expect(list.status).toBe(200);
  expect(list.body.length).toBeGreaterThanOrEqual(2);

  // auth flow
  const email = "import_tester@example.com";
  const password = "secret123";
  await request(app).post("/api/auth/register").send({ email, password });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const token = login.body.token;

  const courseId = list.body[0]._id;
  const lectures = await request(app)
    .get(`/api/courses/${courseId}/lectures`)
    .set("Authorization", `Bearer ${token}`);
  expect(lectures.status).toBe(200);
  expect(Array.isArray(lectures.body)).toBe(true);
  expect(lectures.body.length).toBeGreaterThanOrEqual(3);
  for (let i = 1; i < lectures.body.length; i++) {
    expect(lectures.body[i].orderIndex).toBeGreaterThanOrEqual(lectures.body[i-1].orderIndex);
  }
});
