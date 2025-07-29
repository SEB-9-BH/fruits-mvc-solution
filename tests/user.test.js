const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8080, () => {
    console.log('Testing on port 8080')
})

const User = require('../models/user')

let mongoServer 

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async()=> {
    await mongoose.connection.close() // close connection from mongoose to database/mongodb memory server
    mongoServer.stop() // shutoff mongodb memory server
    server.close() // shutoff node server
})

afterAll((done) => done())

describe('Test the users endpoints',() => {
   test('It Should Create A New User', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe@example.com', password: 'password123'})

    expect(response.statusCode).toBe(200)
    expect(response.body.user.name).toEqual('John Doe')
    expect(response.body.user.email).toEqual('john.doe@example.com')
    expect(response.body).toHaveProperty('token')
   })
   //test()
   test('It should login a user', async () => {
    const user = new User({ name: 'John Doe', email: 'john.doe@example.com', password: 'password123' })
    await user.save()

    const response = await request(app)
      .post('/users/login')
      .send({ email: 'john.doe@example.com', password: 'password123' })

     const isCorrectPassword = await bcrypt.compare('password123', user.password)
    
    expect(response.statusCode).toBe(200)
    expect(isCorrectPassword).toBeTruthy()
    expect(response.body.user.name).toEqual('John Doe')
    expect(response.body.user.email).toEqual('john.doe@example.com')
    expect(response.body).toHaveProperty('token')
  })
  test('It should update a user', async () => {
    const user = new User({ name: 'Fatema', email: 'fatema@example.com', password: 'password123' })
    await user.save()
    const token = await user.generateAuthToken()

    const response = await request(app)
      .put(`/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Kristina', email: 'kristina@example.com' })
    
    expect(response.statusCode).toBe(200)
    expect(response.body.name).toEqual('Kristina')
    expect(response.body.email).toEqual('kristina@example.com')
  })
   //test()
   test('It should delete a user', async () => {
    const user = new User({ name: 'John Doe', email: 'john.doe@example.com', password: 'password123' })
    await user.save()
    const token = await user.generateAuthToken()

    const response = await request(app)
      .delete(`/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
    
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toEqual('User deleted')
  })
})