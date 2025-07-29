const express = require('express')
const router = express.Router()
const dataController = require('./dataController')
const viewController = require('./viewController')
const fruitsViewController = require('../fruits/viewController')

router.post('/', dataController.createUser, viewController.redirectToLogin)// signup user => login page
router.get('/', viewController.signUp) // show sign up form
router.post('/login', dataController.loginUser, fruitsViewController.redirectHome)
router.get('/login', viewController.signIn) // show login form
router.put('/:id', dataController.updateUser)
router.delete('/:id', dataController.auth, dataController.deleteUser)

module.exports = router
