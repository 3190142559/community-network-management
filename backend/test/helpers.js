const supertest = require('supertest');
const { createApp } = require('../app');

// Create the app with an in-memory database for testing
const app = createApp(':memory:');
const request = supertest(app);

async function loginAs(role) {
  const users = {
    admin: { username: 'admin', password: '123456' },
    user: { username: 'user1', password: '123456' },
    maintainer: { username: 'maintainer1', password: '123456' }
  };
  const res = await request.post('/api/auth/login').send(users[role]);
  return res.body.data.token;
}

module.exports = { request, loginAs };
