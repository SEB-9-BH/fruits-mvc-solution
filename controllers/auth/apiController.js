const User = require('../../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// API Authentication middleware - uses headers instead of query params
exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const data = jwt.verify(token, 'secret')
    const user = await User.findOne({ _id: data._id })
    if (!user) {
      throw new Error()
    }
    req.user = user
    next()
  } catch (error) {
    res.status(401).send('Not authorized')
  }
}

// API User creation
exports.createUser = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    
    const user = new User(req.body)
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).json({ user, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// API User login
exports.loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      return res.status(400).json({ message: 'Invalid login credentials' })
    }
    const token = await user.generateAuthToken()
    res.json({ user, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// API User update
exports.updateUser = async (req, res) => {
  try {
    const updates = Object.keys(req.body)
    const user = await User.findOne({ _id: req.params.id })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    updates.forEach(update => user[update] = req.body[update])
    await user.save()
    res.json(user)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// API User deletion
exports.deleteUser = async (req, res) => {
  try {
    await req.user.deleteOne()
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// API Get user profile
exports.getProfile = async (req, res) => {
  try {
    await req.user.populate('fruits')
    res.json({ user: req.user })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
} 