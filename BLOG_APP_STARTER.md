# Blog App Starter Guide

A complete step-by-step guide to build a blog application that meets all Project 2 requirements.

---

## 🎯 Project Overview

### **Blog Application Requirements**
- **2+ Models**: Author (User) and Post (Blog Post)
- **Full MVC Architecture**: Models, Views, Controllers
- **Authentication**: JWT-based login/registration
- **Unit Testing**: Test suite for at least 1 model
- **Styling**: Beautiful, responsive CSS
- **API Endpoints**: RESTful API for mobile apps

### **Models**
1. **Author** (User) - Blog authors with authentication
2. **Post** (Blog Post) - Blog posts with content, author relationship

---

## 📁 File Structure

```
blog-app/
├── server.js                 # Entry point
├── app.js                    # Express configuration
├── package.json              # Dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore file
├── models/
│   ├── db.js                # Database connection
│   ├── author.js            # Author model
│   └── post.js              # Post model
├── controllers/
│   ├── auth/
│   │   ├── dataController.js # Auth data logic
│   │   ├── apiController.js  # Auth API logic
│   │   ├── routeController.js # Auth web routes
│   │   └── viewController.js # Auth view logic
│   └── posts/
│       ├── dataController.js # Post data logic
│       ├── apiController.js  # Post API logic
│       ├── routeController.js # Post web routes
│       └── viewController.js # Post view logic
├── routes/
│   └── apiRoutes.js         # API routes
├── views/
│   ├── layouts/
│   │   └── Layout.jsx       # Main layout
│   ├── auth/
│   │   ├── SignUp.jsx       # Registration form
│   │   └── SignIn.jsx       # Login form
│   └── posts/
│       ├── Index.jsx        # Posts list
│       ├── Show.jsx         # Single post
│       ├── New.jsx          # Create form
│       └── Edit.jsx         # Edit form
├── public/
│   ├── styles.css           # Main stylesheet
│   └── background.png       # Background image
├── tests/
│   ├── author.test.js       # Author API tests
│   ├── post.test.js         # Post API tests
│   └── integration.test.js  # Integration tests
└── README.md                # Project documentation
```

---

## 🚀 Step 1: Project Setup

### **1.1 Initialize Project**
```bash
mkdir blog-app
cd blog-app
npm init -y
```

### **1.2 Install Dependencies**
```bash
npm install express mongoose bcrypt jsonwebtoken jsx-view-engine method-override morgan dotenv
npm install --save-dev jest supertest mongodb-memory-server
```

### **1.3 Create package.json Scripts**
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 🗄️ Step 2: Database Models

### **2.1 Database Connection (`models/db.js`)**
```javascript
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection

module.exports = db
```

### **2.2 Author Model (`models/author.js`)**
```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
})

// Hide password from JSON responses
authorSchema.methods.toJSON = function() {
  const author = this.toObject()
  delete author.password
  return author
}

// Hash password before saving
authorSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8)
  }
  next()
})

// Generate JWT token
authorSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, 'secret')
  return token
}

const Author = mongoose.model('Author', authorSchema)

module.exports = Author
```

### **2.3 Post Model (`models/post.js`)**
```javascript
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: true
  },
  published: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post
```

---

## 🔧 Step 3: Application Setup

### **3.1 Server Entry Point (`server.js`)**
```javascript
require('dotenv').config()
const app = require('./app')
const db = require('./models/db')
const PORT = process.env.PORT || 3000

db.once('open', () => {
  console.log('Connected to MongoDB')
})

db.on('error', (error) => {
  console.error(error.message)
})

app.listen(PORT, () => {
  console.log(`Blog server running on port ${PORT}`)
})
```

### **3.2 Express Configuration (`app.js`)**
```javascript
const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const authorRoutes = require('./controllers/auth/routeController')
const postRoutes = require('./controllers/posts/routeController')
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

// Web routes (for views)
app.use('/authors', authorRoutes)
app.use('/posts', postRoutes)

// API routes (for JSON responses)
app.use('/api', apiRoutes)

module.exports = app
```

---

## 🔐 Step 4: Authentication Controllers

### **4.1 Auth Data Controller (`controllers/auth/dataController.js`)**
```javascript
const Author = require('../../models/author')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
    const author = await Author.findOne({ _id: data._id })
    if (!author) {
      throw new Error()
    }
    req.author = author
    res.locals.data.token = token
    next()
  } catch (error) {
    res.status(401).send('Not authorized')
  }
}

exports.createAuthor = async (req, res, next) => {
  try{
    const author = new Author(req.body)
    await author.save()
    const token = await author.generateAuthToken()
    res.locals.data.token = token 
    req.author = author
    next()
  } catch(error){
    res.status(400).json({message: error.message})
  }
}

exports.loginAuthor = async (req, res, next) => {
  try{
    const author = await Author.findOne({ email: req.body.email })
    if (!author || !await bcrypt.compare(req.body.password, author.password)) {
      res.status(400).send('Invalid login credentials')
    } else {
      const token = await author.generateAuthToken()
      res.locals.data.token = token 
      req.author = author
      next()
    }
  } catch(error){
    res.status(400).json({message: error.message})
  }
}
```

### **4.2 Auth API Controller (`controllers/auth/apiController.js`)**
```javascript
const Author = require('../../models/author')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const data = jwt.verify(token, 'secret')
    const author = await Author.findOne({ _id: data._id })
    if (!author) {
      throw new Error()
    }
    req.author = author
    next()
  } catch (error) {
    res.status(401).send('Not authorized')
  }
}

exports.createAuthor = async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    
    const author = new Author(req.body)
    await author.save()
    const token = await author.generateAuthToken()
    res.status(201).json({ author, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.loginAuthor = async (req, res) => {
  try {
    const author = await Author.findOne({ email: req.body.email })
    if (!author || !await bcrypt.compare(req.body.password, author.password)) {
      return res.status(400).json({ message: 'Invalid login credentials' })
    }
    const token = await author.generateAuthToken()
    res.json({ author, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    await req.author.populate('posts')
    res.json({ author: req.author })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
```

---

## 📝 Step 5: Post Controllers

### **5.1 Post Data Controller (`controllers/posts/dataController.js`)**
```javascript
const Post = require('../../models/post')

const dataController = {}

dataController.index = async (req, res, next) => {
  try {
    const author = await req.author.populate('posts')
    res.locals.data.posts = author.posts
    next()
  } catch(error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.create = async (req, res, next) => {
  if(req.body.published === 'on'){
    req.body.published = true;
  } else if(req.body.published !== true) {
    req.body.published = false;
  }
  try {
    req.body.author = req.author._id
    res.locals.data.post = await Post.create(req.body)
    req.author.posts.addToSet({_id: res.locals.data.post._id })
    await req.author.save()
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.show = async (req, res, next) => {
  try {
    res.locals.data.post = await Post.findById(req.params.id)
    if(!res.locals.data.post){
      throw new Error(`Could not locate a post with the id ${req.params.id}`)
    }
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.update = async (req, res, next) => {
  if(req.body.published === 'on'){
    req.body.published = true;
  } else if(req.body.published !== true) {
    req.body.published = false;
  }
  try {
    res.locals.data.post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true })
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.destroy = async (req, res, next) => {
  try {
    await Post.findOneAndDelete({'_id': req.params.id }).then(() => {
      next()
    })
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

module.exports = dataController
```

### **5.2 Post API Controller (`controllers/posts/apiController.js`)**
```javascript
const Post = require('../../models/post')

const apiController = {
  index(req, res) {
    res.json(res.locals.data.posts)
  },

  show(req, res) {
    res.json(res.locals.data.post)
  },

  create(req, res) {
    res.status(201).json(res.locals.data.post)
  },

  destroy(req, res) {
    res.status(200).json({ message: 'Post successfully deleted' })
  }
}

module.exports = apiController
```

---

## 🛣️ Step 6: Routes

### **6.1 Auth Routes (`controllers/auth/routeController.js`)**
```javascript
const express = require('express')
const router = express.Router()
const dataController = require('./dataController')
const viewController = require('./viewController')
const postsViewController = require('../posts/viewController')

router.post('/', dataController.createAuthor, viewController.redirectToLogin)
router.get('/', viewController.signUp)
router.post('/login', dataController.loginAuthor, postsViewController.redirectHome)
router.get('/login', viewController.signIn)

module.exports = router
```

### **6.2 Post Routes (`controllers/posts/routeController.js`)**
```javascript
const express = require('express')
const router = express.Router()
const viewController = require('./viewController')
const dataController = require('./dataController')
const authDataController = require('../auth/dataController')

router.get('/', authDataController.auth, dataController.index, viewController.index)
router.get('/new', authDataController.auth, viewController.newView)
router.delete('/:id', authDataController.auth, dataController.destroy, viewController.redirectHome)
router.put('/:id', authDataController.auth, dataController.update, viewController.redirectShow)
router.post('/', authDataController.auth, dataController.create, viewController.redirectHome)
router.get('/:id/edit', authDataController.auth, dataController.show, viewController.edit)
router.get('/:id', authDataController.auth, dataController.show, viewController.show)

module.exports = router
```

### **6.3 API Routes (`routes/apiRoutes.js`)**
```javascript
const express = require('express')
const router = express.Router()
const authorApiController = require('../controllers/auth/apiController')
const postApiController = require('../controllers/posts/apiController')
const postDataController = require('../controllers/posts/dataController')

// Author API Routes
router.post('/authors', authorApiController.createAuthor)
router.post('/authors/login', authorApiController.loginAuthor)
router.get('/authors/profile', authorApiController.auth, authorApiController.getProfile)

// Post API Routes
router.get('/posts', authorApiController.auth, postDataController.index, postApiController.index)
router.get('/posts/:id', authorApiController.auth, postDataController.show, postApiController.show)
router.post('/posts', authorApiController.auth, postDataController.create, postApiController.create)
router.put('/posts/:id', authorApiController.auth, postDataController.update, postApiController.show)
router.delete('/posts/:id', authorApiController.auth, postDataController.destroy, postApiController.destroy)

module.exports = router
```

---

## 🎨 Step 7: Views

### **7.1 Layout (`views/layouts/Layout.jsx`)**
```javascript
const React = require('react')

function Layout(props){
 return(
    <html>
        <head>
            <title>{!props.post?.title ? 'Blog App - Share Your Stories' : `${props.post.title} - Blog App`}</title>
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

### **7.2 Auth Views**

#### **SignUp (`views/auth/SignUp.jsx`)**
```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignUp(){
  return(
    <Layout>
      <div>
        <h1>Join Our Blog Community</h1>
        <form action="/authors" method="POST">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio:</label>
            <textarea id="bio" name="bio" rows="4"></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        <p>Already have an account? <a href="/authors/login">Sign In</a></p>
      </div>
    </Layout>
  )
}

module.exports = SignUp
```

#### **SignIn (`views/auth/SignIn.jsx`)**
```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignIn(){
  return(
    <Layout>
      <div>
        <h1>Welcome Back</h1>
        <form action="/authors/login" method="POST">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit" className="btn btn-primary">Sign In</button>
        </form>
        <p>Don't have an account? <a href="/authors">Sign Up</a></p>
      </div>
    </Layout>
  )
}

module.exports = SignIn
```

### **7.3 Post Views**

#### **Index (`views/posts/Index.jsx`)**
```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Index({ posts, token }){
  return(
    <Layout>
      <div>
        <h1>My Blog Posts</h1>
        <a href={`/posts/new?token=${token}`} className="btn btn-primary">Create New Post</a>
        
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post._id} className="post-card">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-excerpt">{post.content.substring(0, 150)}...</p>
              <div className="post-meta">
                <span className={`post-status ${post.published ? 'published' : 'draft'}`}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
                <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="post-actions">
                <a href={`/posts/${post._id}?token=${token}`} className="btn btn-secondary">View</a>
                <a href={`/posts/${post._id}/edit?token=${token}`} className="btn btn-secondary">Edit</a>
                <form action={`/posts/${post._id}?_method=DELETE&token=${token}`} method="POST" style={{display: 'inline'}}>
                  <button type="submit" className="btn btn-danger">Delete</button>
                </form>
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

---

## 🧪 Step 8: Testing

### **8.1 Author Tests (`tests/author.test.js`)**
```javascript
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8080, () => console.log('Testing on PORT 8080'))
const Author = require('../models/author')
let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.connection.close()
  mongoServer.stop()
  server.close()
})

afterEach(async () => {
  await Author.deleteMany({})
})

describe('Author API Tests', () => {
  describe('POST /api/authors', () => {
    test('should create a new author successfully', async () => {
      const authorData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        bio: 'A passionate writer'
      }

      const response = await request(app)
        .post('/api/authors')
        .send(authorData)
        .expect(201)

      expect(response.body).toHaveProperty('author')
      expect(response.body).toHaveProperty('token')
      expect(response.body.author.name).toBe(authorData.name)
      expect(response.body.author.email).toBe(authorData.email)
      expect(response.body.author.password).toBeUndefined()
    })

    test('should return 400 for invalid author data', async () => {
      const invalidData = { name: 'John Doe' }

      const response = await request(app)
        .post('/api/authors')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /api/authors/login', () => {
    beforeEach(async () => {
      const author = new Author({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      })
      await author.save()
    })

    test('should login author with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/authors/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('author')
      expect(response.body).toHaveProperty('token')
    })
  })
})
```

### **8.2 Post Tests (`tests/post.test.js`)**
```javascript
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8081, () => console.log('Testing Posts on PORT 8081'))
const Author = require('../models/author')
const Post = require('../models/post')
let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.connection.close()
  mongoServer.stop()
  server.close()
})

afterEach(async () => {
  await Author.deleteMany({})
  await Post.deleteMany({})
})

describe('Post API Tests', () => {
  let author, token

  beforeEach(async () => {
    author = new Author({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    })
    await author.save()
    token = await author.generateAuthToken()
  })

  describe('POST /api/posts', () => {
    test('should create new post successfully', async () => {
      const postData = {
        title: 'My First Blog Post',
        content: 'This is the content of my first blog post.',
        published: true
      }

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(postData)
        .expect(201)

      expect(response.body).toHaveProperty('title', postData.title)
      expect(response.body).toHaveProperty('content', postData.content)
      expect(response.body).toHaveProperty('published', postData.published)
    })
  })

  describe('GET /api/posts', () => {
    test('should get all posts for authenticated author', async () => {
      const post = new Post({
        title: 'Test Post',
        content: 'Test content',
        author: author._id
      })
      await post.save()

      author.posts.addToSet(post._id)
      await author.save()

      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toHaveProperty('title')
    })
  })
})
```

---

## 🎨 Step 9: Styling

### **9.1 Main Stylesheet (`public/styles.css`)**
```css
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #2c3e50;
    background: url('/background.png') no-repeat center center fixed;
    background-size: cover;
    min-height: 100vh;
    padding: 20px;
}

/* Container */
.container {
    max-width: 1000px;
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
    color: #3498db;
}

h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

/* Forms */
.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
}

input[type="text"],
input[type="email"],
input[type="password"],
textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
textarea:focus {
    outline: none;
    border-color: #3498db;
}

textarea {
    resize: vertical;
    min-height: 100px;
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
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover {
    background: #7f8c8d;
    transform: translateY(-2px);
}

.btn-danger {
    background: #e74c3c;
    color: white;
}

.btn-danger:hover {
    background: #c0392b;
    transform: translateY(-2px);
}

/* Post grid */
.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 1rem 0;
}

.post-card {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
    border: 1px solid #e9ecef;
    transition: transform 0.3s ease;
}

.post-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.post-title {
    font-size: 1.4rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.post-excerpt {
    color: #7f8c8d;
    margin-bottom: 1rem;
    line-height: 1.5;
}

.post-meta {
    margin-bottom: 1rem;
}

.post-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.875rem;
    font-weight: bold;
    margin-right: 0.5rem;
}

.post-status.published {
    background: #d5f4e6;
    color: #27ae60;
}

.post-status.draft {
    background: #fdf2e9;
    color: #e67e22;
}

.post-date {
    color: #95a5a6;
    font-size: 0.875rem;
}

.post-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
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

## 📋 Step 10: Environment Setup

### **10.1 Environment Variables (`.env`)**
```
MONGODB_URI=mongodb://localhost:27017/blog-app
PORT=3000
```

### **10.2 Git Ignore (`.gitignore`)**
```
node_modules/
.env
.DS_Store
```

---

## 🚀 Step 11: Running the Application

### **11.1 Start Development Server**
```bash
npm run dev
```

### **11.2 Run Tests**
```bash
npm test
```

### **11.3 Test Coverage**
```bash
npm run test:coverage
```

---

## ✅ Project 2 Requirements Checklist

### **✅ 2+ Models**
- **Author Model**: User authentication, profile management
- **Post Model**: Blog posts with author relationships

### **✅ Full MVC Architecture**
- **Models**: `models/author.js`, `models/post.js`
- **Views**: JSX templates for web interface
- **Controllers**: Data controllers, API controllers, view controllers

### **✅ Authentication System**
- JWT-based authentication
- Registration and login functionality
- Protected routes for blog management

### **✅ Unit Testing**
- Author API tests (`tests/author.test.js`)
- Post API tests (`tests/post.test.js`)
- Integration tests (`tests/integration.test.js`)

### **✅ Styling**
- Responsive CSS with modern design
- Background image integration
- User-friendly interface

### **✅ API Endpoints**
- RESTful API for authors and posts
- JSON responses for mobile apps
- Authentication via headers

### **✅ Bonus Features**
- Load testing with Artillery
- Comprehensive error handling
- Clean code organization

---

## 🎯 Next Steps for Students

1. **Follow the step-by-step guide** to build the blog application
2. **Customize the styling** to match your personal brand
3. **Add additional features** like comments, categories, or search
4. **Deploy the application** to Heroku or similar platform
5. **Write comprehensive tests** for all functionality
6. **Document your process** in the README.md file

This blog application serves as a complete example that meets all Project 2 requirements