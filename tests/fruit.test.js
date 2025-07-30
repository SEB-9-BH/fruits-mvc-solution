const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8081, () => console.log('Testing Fruits on PORT 8081'))
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

describe('Fruit API Tests', () => {
  let user, token

  beforeEach(async () => {
    user = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    })
    await user.save()
    token = await user.generateAuthToken()
  })

  describe('GET /api/fruits', () => {
    test('should get all fruits for authenticated user', async () => {
      // Create some fruits for the user
      const fruit1 = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      })
      const fruit2 = new Fruit({
        name: 'Banana',
        color: 'Yellow',
        readyToEat: false
      })
      await fruit1.save()
      await fruit2.save()

      // Add fruits to user
      user.fruits.addToSet(fruit1._id, fruit2._id)
      await user.save()

      const response = await request(app)
        .get('/api/fruits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toHaveProperty('name')
      expect(response.body[0]).toHaveProperty('color')
      expect(response.body[0]).toHaveProperty('readyToEat')
    })

    test('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/fruits')
        .expect(401)

      expect(response.text).toBe('Not authorized')
    })
  })

  describe('GET /api/fruits/:id', () => {
    test('should get single fruit by id', async () => {
      const fruit = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      })
      await fruit.save()

      const response = await request(app)
        .get(`/api/fruits/${fruit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('name', 'Apple')
      expect(response.body).toHaveProperty('color', 'Red')
      expect(response.body).toHaveProperty('readyToEat', true)
    })

    test('should return 400 for non-existent fruit', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const response = await request(app)
        .get(`/api/fruits/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /api/fruits', () => {
    test('should create new fruit successfully', async () => {
      const fruitData = {
        name: 'Orange',
        color: 'Orange',
        readyToEat: true
      }

      const response = await request(app)
        .post('/api/fruits')
        .set('Authorization', `Bearer ${token}`)
        .send(fruitData)
        .expect(201)

      expect(response.body).toHaveProperty('name', fruitData.name)
      expect(response.body).toHaveProperty('color', fruitData.color)
      expect(response.body).toHaveProperty('readyToEat', fruitData.readyToEat)

      // Verify fruit was added to user's fruits array
      const updatedUser = await User.findById(user._id).populate('fruits')
      expect(updatedUser.fruits).toHaveLength(1)
      expect(updatedUser.fruits[0].name).toBe(fruitData.name)
    })

    test('should handle checkbox conversion correctly', async () => {
      const fruitData = {
        name: 'Strawberry',
        color: 'Red',
        readyToEat: 'on' // Checkbox sends 'on' when checked
      }

      const response = await request(app)
        .post('/api/fruits')
        .set('Authorization', `Bearer ${token}`)
        .send(fruitData)
        .expect(201)

      expect(response.body).toHaveProperty('readyToEat', true)
    })

    test('should return 401 without token', async () => {
      const fruitData = {
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      }

      const response = await request(app)
        .post('/api/fruits')
        .send(fruitData)
        .expect(401)

      expect(response.text).toBe('Not authorized')
    })
  })

  describe('PUT /api/fruits/:id', () => {
    test('should update fruit successfully', async () => {
      const fruit = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: false
      })
      await fruit.save()

      const updateData = {
        name: 'Green Apple',
        color: 'Green',
        readyToEat: true
      }

      const response = await request(app)
        .put(`/api/fruits/${fruit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('name', updateData.name)
      expect(response.body).toHaveProperty('color', updateData.color)
      expect(response.body).toHaveProperty('readyToEat', updateData.readyToEat)
    })

    test('should handle checkbox conversion in updates', async () => {
      const fruit = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: false
      })
      await fruit.save()

      const updateData = {
        name: 'Apple',
        color: 'Red',
        readyToEat: 'on'
      }

      const response = await request(app)
        .put(`/api/fruits/${fruit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('readyToEat', true)
    })
  })

  describe('DELETE /api/fruits/:id', () => {
    test('should delete fruit successfully', async () => {
      const fruit = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      })
      await fruit.save()

      const response = await request(app)
        .delete(`/api/fruits/${fruit._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Fruit successfully deleted')

      // Verify fruit is actually deleted
      const deletedFruit = await Fruit.findById(fruit._id)
      expect(deletedFruit).toBeNull()
    })

    test('should return 401 without token', async () => {
      const fruit = new Fruit({
        name: 'Apple',
        color: 'Red',
        readyToEat: true
      })
      await fruit.save()

      const response = await request(app)
        .delete(`/api/fruits/${fruit._id}`)
        .expect(401)

      expect(response.text).toBe('Not authorized')
    })
  })
}) 