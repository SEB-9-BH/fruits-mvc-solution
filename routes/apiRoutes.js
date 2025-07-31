const express = require('express')
const router = express.Router()
const userApiController = require('../controllers/auth/apiController')
const fruitApiController = require('../controllers/fruits/apiController')
const fruitDataController = require('../controllers/fruits/dataController')

// User API Routes
router.post('/users', userApiController.createUser)
router.post('/users/login', userApiController.loginUser)
router.get('/users/profile', userApiController.auth, userApiController.getProfile)
router.put('/users/:id', userApiController.auth, userApiController.updateUser)
router.delete('/users/:id', userApiController.auth, userApiController.deleteUser)

// Fruit API Routes
router.get('/fruits', userApiController.auth, fruitDataController.index, fruitApiController.index)
router.get('/fruits/:id', userApiController.auth, fruitDataController.show, fruitApiController.show)
router.post('/fruits', userApiController.auth, fruitDataController.create, fruitApiController.create)
router.put('/fruits/:id', userApiController.auth, fruitDataController.update, fruitApiController.show)
router.delete('/fruits/:id', userApiController.auth, fruitDataController.destroy, fruitApiController.destroy)

module.exports = router 