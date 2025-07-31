const Fruit = require('../../models/fruit.js')

// API Fruit controllers - returns JSON responses
const apiController = {
  // Get all fruits for authenticated user
  index(req, res) {
    res.json(res.locals.data.fruits)
  },

  // Get single fruit
  show(req, res) {
    res.json(res.locals.data.fruit)
  },

  // Create new fruit
  create(req, res) {
    res.status(201).json(res.locals.data.fruit)
  },

  // Delete fruit
  destroy(req, res) {
    res.status(200).json({ message: 'Fruit successfully deleted' })
  }
}

module.exports = apiController 