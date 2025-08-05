# BetweenUs Social Media App: Complete Student Guide

## 🎯 **Project Overview**

**BetweenUs** is a social media forum for anonymous expression where users are represented only by a color and system-generated ID. Users can share "Feels" (thoughts/opinions) and "Asks" (questions) with replies and voting functionality.

**Learning Goals:**
- Build a full-stack social media application
- Implement anonymous user system
- Create post/reply/vote functionality
- Master MVC architecture with Express
- Implement JWT authentication
- Write comprehensive tests

---

## 📋 **Prerequisites**

Before starting, ensure you have:
- ✅ Node.js installed
- ✅ MongoDB Atlas account (or local MongoDB)
- ✅ Basic understanding of Express.js
- ✅ Familiarity with MongoDB/Mongoose
- ✅ Understanding of JWT authentication

---

## 🚀 **Step 1: Project Setup**

### **1.1 Create Project Structure**

```bash
# Create project directory
mkdir betweenus
cd betweenus

# Initialize npm project
npm init -y

# Create directory structure
mkdir controllers models routes views tests public
mkdir controllers/auth controllers/posts controllers/replies controllers/votes
mkdir views/auth views/posts views/replies views/profile
mkdir public/css public/images
```

### **1.2 Install Dependencies**

```bash
# Install core dependencies
npm install express mongoose dotenv bcrypt jsonwebtoken method-override morgan

# Install development dependencies
npm install --save-dev jest supertest mongodb-memory-server artillery

# Install view engine
npm install jsx-view-engine
```

### **1.3 Create Basic Configuration Files**

**`.env`**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/betweenus
JWT_SECRET=your-secret-key-here
```

**`.gitignore`**
```
node_modules/
.env
.DS_Store
coverage/
```

**`package.json` scripts**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "load": "artillery run artillery.yml"
  }
}
```

---

## 🗄️ **Step 2: Database Models**

### **2.1 User Model (`models/User.js`)**

```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  color: {
    type: String,
    required: true,
    default: '#FF6B6B',
    enum: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }],
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }]
}, {
  timestamps: true
})

// Hide password from JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8)
  }
  next()
})

// Generate JWT token
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET)
  return token
}

// Generate random user ID
userSchema.methods.generateUserId = function() {
  const adjectives = ['Swift', 'Bold', 'Calm', 'Bright', 'Wise', 'Kind', 'Pure', 'Wild']
  const nouns = ['River', 'Mountain', 'Ocean', 'Forest', 'Star', 'Moon', 'Sun', 'Wind']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 999) + 1
  return `${adj}${noun}${number}`
}

const User = mongoose.model('User', userSchema)
module.exports = User
```

### **2.2 Post Model (`models/Post.js`)**

```javascript
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ask', 'feel'],
    default: 'feel'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }],
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }],
  voteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

const Post = mongoose.model('Post', postSchema)
module.exports = Post
```

### **2.3 Reply Model (`models/Reply.js`)**

```javascript
const mongoose = require('mongoose')

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }],
  voteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

const Reply = mongoose.model('Reply', replySchema)
module.exports = Reply
```

### **2.4 Vote Model (`models/Vote.js`)**

```javascript
const mongoose = require('mongoose')

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  },
  value: {
    type: Number,
    required: true,
    enum: [1, -1] // 1 for upvote, -1 for downvote
  }
}, {
  timestamps: true
})

// Ensure user can only vote once per post/reply
voteSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true })
voteSchema.index({ user: 1, reply: 1 }, { unique: true, sparse: true })

const Vote = mongoose.model('Vote', voteSchema)
module.exports = Vote
```

---

## 🔧 **Step 3: Database Connection**

### **3.1 Database Connection (`models/db.js`)**

```javascript
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection

db.on('connected', () => {
  console.log('✅ Connected to MongoDB')
})

db.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err)
})

module.exports = db
```

---

## 🛣️ **Step 4: Controllers**

### **4.1 User Data Controller (`controllers/auth/dataController.js`)**

```javascript
const User = require('../../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Authentication middleware
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
    const data = jwt.verify(token, process.env.JWT_SECRET)
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
}

// Create new user
exports.createUser = async (req, res, next) => {
  try {
    const user = new User(req.body)
    user.userId = user.generateUserId()
    await user.save()
    const token = await user.generateAuthToken()
    res.locals.data.token = token
    req.user = user
    next()
  } catch(error){
    res.status(400).json({message: error.message})
  }
}

// Login user
exports.loginUser = async (req, res, next) => {
  try {
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

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = Object.keys(req.body)
    const user = await User.findOne({ _id: req.params.id })
    updates.forEach(update => user[update] = req.body[update])
    await user.save()
    res.json(user)
  }catch(error){
    res.status(400).json({message: error.message})
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await req.user.deleteOne()
    res.json({ message: 'User deleted' })
  }catch(error){
    res.status(400).json({message: error.message})
  }
}
```

### **4.2 User View Controller (`controllers/auth/viewController.js`)**

```javascript
const User = require('../../models/User')

// Show signup form
exports.signUp = (req, res) => {
  res.render('auth/SignUp')
}

// Show login form
exports.signIn = (req, res) => {
  res.render('auth/Login')
}

// Show user profile
exports.showProfile = async (req, res) => {
  try {
    await req.user.populate('posts')
    res.render('profile/Profile', { user: req.user })
  } catch (error) {
    res.status(400).send(error.message)
  }
}
```

### **4.3 User API Controller (`controllers/auth/apiController.js`)**

```javascript
const User = require('../../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// API Authentication middleware
exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const data = jwt.verify(token, process.env.JWT_SECRET)
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
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    const user = new User(req.body)
    user.userId = user.generateUserId()
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

// API Get user profile
exports.getProfile = async (req, res) => {
  try {
    await req.user.populate('posts')
    res.json({ user: req.user })
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
```

### **4.4 Post Data Controller (`controllers/posts/dataController.js`)**

```javascript
const Post = require('../../models/Post')

const dataController = {}

// Get all posts
dataController.index = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.type) {
      filter.type = req.query.type
    }
    res.locals.data.posts = await Post.find(filter)
      .populate('author', 'userId color')
      .populate('replies')
      .sort({ createdAt: -1 })
    next()
  } catch(error) {
    res.status(400).send({ message: error.message })
  }
}

// Get single post
dataController.show = async (req, res, next) => {
  try {
    res.locals.data.post = await Post.findById(req.params.id)
      .populate('author', 'userId color')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'userId color' }
      })
    if(!res.locals.data.post){
      throw new Error(`Could not locate a post with the id ${req.params.id}`)
    }
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Create new post
dataController.create = async (req, res, next) => {
  try {
    req.body.author = req.user._id
    res.locals.data.post = await Post.create(req.body)
    req.user.posts.addToSet({_id: res.locals.data.post._id })
    await req.user.save()
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Update post
dataController.update = async (req, res, next) => {
  try {
    res.locals.data.post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true })
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Delete post
dataController.destroy = async (req, res, next) => {
  try {
    await Post.findOneAndDelete({'_id': req.params.id })
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

module.exports = dataController
```

### **4.5 Post View Controller (`controllers/posts/viewController.js`)**

```javascript
// Show all posts
exports.index = (req, res) => {
  res.render('posts/Index', { posts: res.locals.data.posts })
}

// Show single post
exports.show = (req, res) => {
  res.render('posts/Show', { post: res.locals.data.post })
}

// Show new post form
exports.new = (req, res) => {
  res.render('posts/New')
}

// Show edit post form
exports.edit = (req, res) => {
  res.render('posts/Edit', { post: res.locals.data.post })
}
```

### **4.6 Post API Controller (`controllers/posts/apiController.js`)**

```javascript
// API Post controllers - returns JSON responses
const apiController = {
  // Get all posts
  index(req, res) {
    res.json(res.locals.data.posts)
  },

  // Get single post
  show(req, res) {
    res.json(res.locals.data.post)
  },

  // Create new post
  create(req, res) {
    res.status(201).json(res.locals.data.post)
  },

  // Update post
  update(req, res) {
    res.json(res.locals.data.post)
  },

  // Delete post
  destroy(req, res) {
    res.status(200).json({ message: 'Post successfully deleted' })
  }
}

module.exports = apiController
```

---

## 🛣️ **Step 5: Routes**

### **5.1 User Routes (`routes/userRoutes.js`)**

```javascript
const express = require('express')
const router = express.Router()
const userDataController = require('../controllers/auth/dataController')
const userViewController = require('../controllers/auth/viewController')

// Web routes
router.get('/signup', userViewController.signUp)
router.post('/signup', userDataController.createUser, userViewController.signIn)
router.get('/login', userViewController.signIn)
router.post('/login', userDataController.loginUser, userViewController.showProfile)
router.get('/profile', userDataController.auth, userViewController.showProfile)
router.put('/:id', userDataController.auth, userDataController.updateUser)
router.delete('/:id', userDataController.auth, userDataController.deleteUser)

module.exports = router
```

### **5.2 Post Routes (`routes/postRoutes.js`)**

```javascript
const express = require('express')
const router = express.Router()
const postDataController = require('../controllers/posts/dataController')
const postViewController = require('../controllers/posts/viewController')
const userDataController = require('../controllers/auth/dataController')

// Web routes
router.get('/', userDataController.auth, postDataController.index, postViewController.index)
router.get('/new', userDataController.auth, postViewController.new)
router.post('/', userDataController.auth, postDataController.create, postViewController.show)
router.get('/:id', userDataController.auth, postDataController.show, postViewController.show)
router.get('/:id/edit', userDataController.auth, postDataController.show, postViewController.edit)
router.put('/:id', userDataController.auth, postDataController.update, postViewController.show)
router.delete('/:id', userDataController.auth, postDataController.destroy)

module.exports = router
```

### **5.3 API Routes (`routes/apiRoutes.js`)**

```javascript
const express = require('express')
const router = express.Router()
const userApiController = require('../controllers/auth/apiController')
const postApiController = require('../controllers/posts/apiController')
const postDataController = require('../controllers/posts/dataController')

// User API Routes
router.post('/users', userApiController.createUser)
router.post('/users/login', userApiController.loginUser)
router.get('/users/profile', userApiController.auth, userApiController.getProfile)
router.put('/users/:id', userApiController.auth, userApiController.updateUser)
router.delete('/users/:id', userApiController.auth, userApiController.deleteUser)

// Post API Routes
router.get('/posts', userApiController.auth, postDataController.index, postApiController.index)
router.get('/posts/:id', userApiController.auth, postDataController.show, postApiController.show)
router.post('/posts', userApiController.auth, postDataController.create, postApiController.create)
router.put('/posts/:id', userApiController.auth, postDataController.update, postApiController.update)
router.delete('/posts/:id', userApiController.auth, postDataController.destroy, postApiController.destroy)

module.exports = router
```

---

## 🎨 **Step 6: Views**

### **6.1 Layout (`views/layouts/Layout.jsx`)**

```javascript
const React = require('react')

function Layout(props){
  return(
    <html>
      <head>
        <title>{!props.post?.title ? 'BetweenUs - Anonymous Expression' : `${props.post.title} - BetweenUs`}</title>
        <link rel="stylesheet" href="/styles.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="container">
          {props.children}
        </div>
      </body>
    </html>
  )
}

module.exports = Layout
```

### **6.2 Sign Up (`views/auth/SignUp.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignUp() {
  return (
    <Layout>
      <div className="auth-container">
        <h1>Join BetweenUs</h1>
        <form action="/users/signup" method="POST">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="form-group">
            <label htmlFor="color">Choose Your Color:</label>
            <select id="color" name="color" required>
              <option value="#FF6B6B">Red</option>
              <option value="#4ECDC4">Teal</option>
              <option value="#45B7D1">Blue</option>
              <option value="#96CEB4">Green</option>
              <option value="#FFEAA7">Yellow</option>
              <option value="#DDA0DD">Purple</option>
              <option value="#98D8C8">Mint</option>
              <option value="#F7DC6F">Gold</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        <p>Already have an account? <a href="/users/login">Login here</a></p>
      </div>
    </Layout>
  )
}

module.exports = SignUp
```

### **6.3 Login (`views/auth/Login.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Login() {
  return (
    <Layout>
      <div className="auth-container">
        <h1>Welcome Back</h1>
        <form action="/users/login" method="POST">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        <p>Don't have an account? <a href="/users/signup">Sign up here</a></p>
      </div>
    </Layout>
  )
}

module.exports = Login
```

### **6.4 Posts Index (`views/posts/Index.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Index(props) {
  const { posts } = props
  const token = props.token

  return (
    <Layout>
      <div className="posts-container">
        <div className="header">
          <h1>BetweenUs Feed</h1>
          <a href={`/posts/new?token=${token}`} className="btn btn-primary">New Post</a>
        </div>
        
        <div className="filter-tabs">
          <a href={`/posts?token=${token}`} className="tab active">All</a>
          <a href={`/posts?type=ask&token=${token}`} className="tab">Asks</a>
          <a href={`/posts?type=feel&token=${token}`} className="tab">Feels</a>
        </div>

        <div className="posts-grid">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <div className="author" style={{color: post.author.color}}>
                  {post.author.userId}
                </div>
                <span className={`post-type ${post.type}`}>
                  {post.type === 'ask' ? '❓ Ask' : '💭 Feel'}
                </span>
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
              <div className="post-footer">
                <span className="vote-count">Votes: {post.voteCount}</span>
                <span className="reply-count">Replies: {post.replies.length}</span>
                <a href={`/posts/${post._id}?token=${token}`} className="btn btn-secondary">View</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

module.exports = Index
```

### **6.5 New Post (`views/posts/New.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function New(props) {
  const token = props.token

  return (
    <Layout>
      <div className="form-container">
        <h1>Share Your Thoughts</h1>
        <form action={`/posts?token=${token}`} method="POST">
          <div className="form-group">
            <label htmlFor="type">Post Type:</label>
            <select id="type" name="type" required>
              <option value="feel">💭 Feel (Share your thoughts)</option>
              <option value="ask">❓ Ask (Ask a question)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" required maxLength="200" />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content:</label>
            <textarea id="content" name="content" required maxLength="2000" rows="6"></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Create Post</button>
          <a href={`/posts?token=${token}`} className="btn btn-secondary">Cancel</a>
        </form>
      </div>
    </Layout>
  )
}

module.exports = New
```

---

## 🧪 **Step 7: Testing**

### **7.1 User Tests (`tests/user.test.js`)**

```javascript
const request = require('supertest')
const app = require('../app')
const User = require('../models/User')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await User.deleteMany({})
})

describe('User API', () => {
  test('POST /api/users - should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      color: '#FF6B6B'
    }

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201)

    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe(userData.email)
    expect(response.body.user.password).toBeUndefined()
    expect(response.body.user.userId).toBeDefined()
    expect(response.body.user.color).toBe(userData.color)
    expect(response.body.token).toBeDefined()
  })

  test('POST /api/users/login - should login user', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      color: '#FF6B6B'
    })
    await user.save()

    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200)

    expect(response.body.user).toBeDefined()
    expect(response.body.token).toBeDefined()
  })

  test('GET /api/users/profile - should get user profile', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      color: '#FF6B6B'
    })
    await user.save()
    const token = await user.generateAuthToken()

    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.user).toBeDefined()
    expect(response.body.user.email).toBe('test@example.com')
  })
})
```

---

## 🎨 **Step 8: Styling**

### **8.1 CSS (`public/styles.css`)**

```css
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Typography */
h1 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #4a5568;
}

h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #2d3748;
}

/* Forms */
.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #4a5568;
}

input[type="text"],
input[type="email"],
input[type="password"],
textarea,
select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
textarea:focus,
select:focus {
    outline: none;
    border-color: #667eea;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    text-decoration: none;
    cursor: pointer;
    margin: 0.5rem;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #718096;
    color: white;
}

.btn-secondary:hover {
    background: #4a5568;
    transform: translateY(-2px);
}

/* Posts */
.posts-container {
    max-width: 800px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.filter-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.tab {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    text-decoration: none;
    color: #4a5568;
    background: #f7fafc;
    transition: all 0.3s ease;
}

.tab.active,
.tab:hover {
    background: #667eea;
    color: white;
}

.posts-grid {
    display: grid;
    gap: 1.5rem;
}

.post-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.post-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.author {
    font-weight: bold;
    font-size: 1.1rem;
}

.post-type {
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.875rem;
    font-weight: bold;
}

.post-type.ask {
    background: #fed7d7;
    color: #c53030;
}

.post-type.feel {
    background: #c6f6d5;
    color: #2f855a;
}

.post-title {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
}

.post-content {
    color: #4a5568;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #718096;
}

/* Auth */
.auth-container {
    max-width: 400px;
    margin: 0 auto;
    text-align: center;
}

/* Utility classes */
.text-center {
    text-align: center;
}

.d-flex {
    display: flex;
}

.gap-2 {
    gap: 0.5rem;
}

.mb-3 {
    margin-bottom: 1rem;
}

.mt-3 {
    margin-top: 1rem;
}
```

---

## 🚀 **Step 9: Application Setup**

### **9.1 App Configuration (`app.js`)**

```javascript
const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')
const apiRoutes = require('./routes/apiRoutes')
const app = express()

app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use((req, res, next) => {
    res.locals.data = {}
    next()
})
app.use(express.static('public'))
app.use(morgan('dev'))

// Web routes
app.use('/users', userRoutes)
app.use('/posts', postRoutes)

// API routes
app.use('/api', apiRoutes)

// Home route
app.get('/', (req, res) => {
    res.redirect('/posts')
})

module.exports = app
```

### **9.2 Server (`server.js`)**

```javascript
require('dotenv').config()
const app = require('./app')
require('./models/db')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`🚀 BetweenUs server running on port ${PORT}`)
})
```

---

## 📋 **Step 10: Final Steps**

### **10.1 Environment Setup**

```bash
# Create .env file
echo "PORT=3000
MONGODB_URI=mongodb://localhost:27017/betweenus
JWT_SECRET=your-super-secret-key-here" > .env
```

### **10.2 Start Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Load testing
npm run load
```

---

## 🎯 **Project Checklist**

### **Core Features:**
- [ ] User registration with color selection
- [ ] Anonymous user system (color + ID)
- [ ] JWT authentication
- [ ] Post creation (Asks & Feels)
- [ ] Post viewing and filtering
- [ ] Basic styling and layout

### **Advanced Features (Optional):**
- [ ] Reply functionality
- [ ] Voting system
- [ ] User profiles
- [ ] Post editing/deletion
- [ ] Search functionality
- [ ] Real-time updates

### **Testing:**
- [ ] User API tests
- [ ] Post API tests
- [ ] Integration tests
- [ ] Load testing

### **Deployment:**
- [ ] Environment variables
- [ ] Database connection
- [ ] Error handling
- [ ] Security considerations

---

## 🚨 **Common Issues & Solutions**

### **Database Connection Issues:**
```bash
# Check MongoDB status
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

### **Module Not Found Errors:**
```bash
# Check file paths
find . -name "*.js" | grep -v node_modules

# Verify requires
node -e "console.log(require('./models/User.js'))"
```

### **Authentication Issues:**
- Check JWT secret consistency
- Verify token format in requests
- Ensure user exists in database

### **View Rendering Issues:**
- Check JSX syntax
- Verify props are passed correctly
- Ensure Layout component is imported

---

## 📚 **Next Steps**

1. **Add Reply Functionality**: Implement reply creation and viewing
2. **Add Voting System**: Implement upvote/downvote functionality
3. **Add User Profiles**: Create detailed user profile pages
4. **Add Search**: Implement post search functionality
5. **Add Real-time Features**: Implement WebSocket connections
6. **Add Image Upload**: Allow users to upload images with posts
7. **Add Notifications**: Implement notification system
8. **Add Moderation**: Add content moderation features

This guide provides a complete foundation for building the BetweenUs social media application. Follow each step carefully, test frequently, and don't hesitate to refer to the debug guide if you encounter issues! 