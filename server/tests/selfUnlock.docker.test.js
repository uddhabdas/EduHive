const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const authRoutes = require('../src/routes/auth');
const coursesRoutes = require('../src/routes/courses');
const devRoutes = require('../src/routes/dev');

let app;

beforeAll(async () => {
  process.env.DEV_SELF_UNLOCK = 'true';
  await mongoose.connect(process.env.MONGODB_URI);
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api', coursesRoutes);
  app.use('/api/dev', devRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
});

test('self-unlock persists access', async () => {
  // seed a course
  const seed = await request(app).post('/api/dev/seed');
  const courseId = seed.body.course._id;

  // register/login
  const email = 'unlocker@example.com';
  const password = 'secret123';
  await request(app).post('/api/auth/register').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  const token = login.body.token;

  // initial access locked
  const access1 = await request(app)
    .get(`/api/courses/${courseId}/access`)
    .set('Authorization', `Bearer ${token}`);
  expect(access1.status).toBe(200);
  expect(['locked','unlocked']).toContain(access1.body.access);

  // self-unlock
  const unlock = await request(app)
    .post(`/api/dev/self-unlock/${courseId}`)
    .set('Authorization', `Bearer ${token}`);
  expect(unlock.status).toBe(200);
  expect(unlock.body.access).toBe('unlocked');

  // now access should be unlocked
  const access2 = await request(app)
    .get(`/api/courses/${courseId}/access`)
    .set('Authorization', `Bearer ${token}`);
  expect(access2.status).toBe(200);
  expect(access2.body.access).toBe('unlocked');
});