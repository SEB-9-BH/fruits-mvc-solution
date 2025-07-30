const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8082, () => console.log('Integration Testing on PORT 8082'))
const User = require('../models/user')
const Fruit = require('../models/fruit')
let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true })
})

afterAll(async () => {
  await mongoose.connection.close()
  mongoServer.stop()
  server.close()
})

afterEach(async () => {
  await User.deleteMany({})
  await Fruit.deleteMany({})
})

describe('Integration Tests', () => {
  describe('Complete User and Fruit Flow', () => {
    test('should create user, login, and manage fruits', async () => {
      // Step 1: Create a new user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201)

      expect(createResponse.body).toHaveProperty('user')
      expect(createResponse.body).toHaveProperty('token')
      const authToken = createResponse.body.token

      // Step 2: Login with the created user
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200)

      expect(loginResponse.body).toHaveProperty('token')
      const loginToken = loginResponse.body.token

      // Step 3: Get user profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(profileResponse.body.user.name).toBe(userData.name)
      expect(profileResponse.body.user.email).toBe(userData.email)

      // Step 4: Create a fruit
      const fruitData = {
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      }

      const createFruitResponse = await request(app)
        .post('/api/fruits')
        .set('Authorization', `Bearer ${loginToken}`)
        .send(fruitData)
        .expect(201)

      expect(createFruitResponse.body.name).toBe(fruitData.name)
      expect(createFruitResponse.body.color).toBe(fruitData.color)
      expect(createFruitResponse.body.readyToEat).toBe(fruitData.readyToEat)

      const fruitId = createFruitResponse.body._id

      // Step 5: Get all fruits
      const getFruitsResponse = await request(app)
        .get('/api/fruits')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(Array.isArray(getFruitsResponse.body)).toBe(true)
      expect(getFruitsResponse.body).toHaveLength(1)
      expect(getFruitsResponse.body[0].name).toBe(fruitData.name)

      // Step 6: Get single fruit
      const getFruitResponse = await request(app)
        .get(`/api/fruits/${fruitId}`)
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(getFruitResponse.body.name).toBe(fruitData.name)

      // Step 7: Update fruit
      const updateData = {
        name: 'Green Apple',
        color: 'Green',
        readyToEat: false
      }

      const updateFruitResponse = await request(app)
        .put(`/api/fruits/${fruitId}`)
        .set('Authorization', `Bearer ${loginToken}`)
        .send(updateData)
        .expect(200)

      expect(updateFruitResponse.body.name).toBe(updateData.name)
      expect(updateFruitResponse.body.color).toBe(updateData.color)
      expect(updateFruitResponse.body.readyToEat).toBe(updateData.readyToEat)

      // Step 8: Delete fruit
      const deleteFruitResponse = await request(app)
        .delete(`/api/fruits/${fruitId}`)
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(deleteFruitResponse.body.message).toBe('Fruit successfully deleted')

      // Step 9: Verify fruit is deleted
      const getFruitsAfterDeleteResponse = await request(app)
        .get('/api/fruits')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      expect(getFruitsAfterDeleteResponse.body).toHaveLength(0)
    })
  })

  describe('Authentication Flow', () => {
    test('should handle authentication errors properly', async () => {
      // Try to access protected route without token
      const noTokenResponse = await request(app)
        .get('/api/fruits')
        .expect(401)

      expect(noTokenResponse.text).toBe('Not authorized')

      // Try to access protected route with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/fruits')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(invalidTokenResponse.text).toBe('Not authorized')

      // Try to access protected route with malformed token
      const malformedTokenResponse = await request(app)
        .get('/api/fruits')
        .set('Authorization', 'Bearer')
        .expect(401)

      expect(malformedTokenResponse.text).toBe('Not authorized')
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid data gracefully', async () => {
      // Try to create user with invalid data
      const invalidUserResponse = await request(app)
        .post('/api/users')
        .send({})
        .expect(400)

      expect(invalidUserResponse.body).toHaveProperty('message')

      // Try to login with non-existent user
      const invalidLoginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(400)

      expect(invalidLoginResponse.body.message).toBe('Invalid login credentials')
    })
  })
}) 