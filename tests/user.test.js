// import needed modules
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {
  userOneId,
  userOne,
  setupDatabase,
} = require('./fixtures/db');

// before every test run prepare our test data
beforeEach(setupDatabase);

// test signup of the new user
test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Test',
      email: 'test@test.com',
      password: 'red1234',
    })
    .expect(201);

  // assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Test',
      email: 'test@test.com',
    },
    token: user.tokens[0].token,
  });

  expect(user.password).not.toBe('red1234');
});

// test login of the user
test('Should login existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

// test login of the non-existing user
test('Should not login non-existing user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: 'thisisnotmypass',
    })
    .expect(400);
});

// test getting profile data of the user
test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

// test validity of not fetching other user data
test('Should not get profile for unauthenticated user', async () => {
  await request(app).get('/users/me').send().expect(401);
});

// test deletion of user
test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

// test validity of not deleting other user
test('Should not delete account for unauthenticated user', async () => {
  await request(app).delete('/users/me').send().expect(401);
});

// test avatar upload
test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

// test update data of the user
test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Hello' })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Hello');
});

// test validity of not being able to update non-existing fields/data
test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Zagreb',
    })
    .expect(400);
});
