const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/user');
const bcrypt = require('bcrypt');

beforeAll(async () => {
  // Disconnect any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to the test DB
  await mongoose.connect('mongodb://localhost:27017/blogapp_test');
  // Clean and seed the test DB
  await User.deleteMany({});
  await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // optional: clears test data
  await mongoose.disconnect();
});

describe('Authentication Routes', () => {
  test('Login with valid credentials should redirect to /homepage', async () => {
    const res = await request(app).post('/login').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/homepage');
  });

  test('Login with invalid credentials should show error', async () => {
    const res = await request(app).post('/login').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'wrongpass',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Invalid email or password');
  });
});

describe('Signup Routes', () => {
  test('GET /signup should return the signup page', async () => {
    const res = await request(app).get('/signup');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Create Account'); // Adjust to some text present in your signup page
  });

  test('POST /signup with valid data should create user and redirect', async () => {
    const res = await request(app).post('/signup').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'newpassword123',
      confirmPassword: 'newpassword123', // If you have password confirmation
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/'); // Adjust to wherever you redirect after signup

    // Optional: you can add a check here to confirm user creation in DB
  });

  test('POST /signup with invalid data should show error', async () => {
    const res = await request(app).post('/signup').send({
      username: '',
      email: 'notanemail',
      password: 'short',
      confirmPassword: 'mismatch',
    });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Username is required');
    expect(res.text).toContain('Enter a valid Email');
    expect(res.text).toContain('Password must be at least 8 characters');
    expect(res.text).toContain('Passwords do not match');
  });
});
