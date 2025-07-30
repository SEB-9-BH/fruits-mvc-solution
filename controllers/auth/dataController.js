const User = require('../../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// instead of creating an object we can use the exports object directly
// this is how

exports.auth = async (req, res, next) => {
  try {
    let token
    if(req.query.token){
      token = req.query.token
    }else if(req.header('Authorization')){
      token = req.header('Authorization').replace('Bearer ', '')
    }else {
      throw new Error('No token provided')
    }
    const data = jwt.verify(token, 'secret')
    const user = await User.findOne({ _id: data._id })
    if (!user) {
      throw new Error()
    }
    req.user = user
    res.locals.data.token = token
    next()
  } catch (error) {
    res.status(401).send('Not authorized')
  }
} // check

exports.createUser = async (req, res, next) => {
  try{
    const user = new User(req.body)
    await user.save()
    const token = await user.generateAuthToken()
    res.locals.data.token = token 
    req.user = user
    next()
  } catch(error){
    res.status(400).json({message: error.message})
  }
}// good but needs to change

exports.loginUser = async (req, res, next) => {
  try{
    const user = await User.findOne({ email: req.body.email })
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      res.status(400).send('Invalid login credentials')
    } else {
      const token = await user.generateAuthToken()
      res.locals.data.token = token 
      req.user = user
      next()
    }
  } catch(error){
    res.status(400).json({message: error.message})
  }
}

exports.updateUser = async (req, res) => {
  try{
    const updates = Object.keys(req.body)
    const user = await User.findOne({ _id: req.params.id })
    updates.forEach(update => user[update] = req.body[update])
    await user.save()
    res.json(user)
  }catch(error){
    res.status(400).json({message: error.message})
  }
  
}

exports.deleteUser = async (req, res) => {
  try{
    await req.user.deleteOne()
    res.json({ message: 'User deleted' })
  }catch(error){
    res.status(400).json({message: error.message})
  }
}