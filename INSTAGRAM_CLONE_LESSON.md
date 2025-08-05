# Instagram Clone: Step-by-Step Lesson Guide

## 🎯 **Lesson Overview**

**Instagram Clone** is a full-stack social media application that replicates core Instagram features including user profiles, photo sharing, likes, comments, and following relationships. This lesson teaches students to build a complete social media platform using modern web technologies.

**Learning Objectives:**
- Build a complete social media application
- Implement user authentication and profiles
- Create photo upload and sharing functionality
- Develop like and comment systems
- Master MVC architecture with Express
- Implement real-time features
- Write comprehensive tests

---

## 📋 **Lesson Prerequisites**

Before starting this lesson, students should have:
- ✅ Basic understanding of HTML, CSS, and JavaScript
- ✅ Familiarity with Node.js and Express.js
- ✅ Understanding of MongoDB and Mongoose
- ✅ Knowledge of JWT authentication
- ✅ Experience with file uploads

---

## 🚀 **Lesson 1: Project Setup & Foundation**

### **Learning Objective:** Set up the project structure and understand the application architecture

### **Step 1.1: Create Project Structure**

```bash
# Create project directory
mkdir instagram-clone
cd instagram-clone

# Initialize npm project
npm init -y

# Create directory structure
mkdir controllers models routes views tests public
mkdir controllers/auth controllers/posts controllers/comments controllers/likes controllers/users
mkdir views/auth views/posts views/users views/profile views/feed
mkdir public/css public/js public/uploads public/images
```

### **Step 1.2: Install Dependencies**

```bash
# Core dependencies
npm install express mongoose dotenv jsx-view-engine method-override morgan bcrypt jsonwebtoken

# File upload dependencies
npm install multer sharp

# Development dependencies
npm install --save-dev jest supertest mongodb-memory-server artillery@1.7.9
```

### **Step 1.3: Environment Configuration**

**`.env`**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/instagram_clone
JWT_SECRET=your-secret-key-here
UPLOAD_PATH=public/uploads
```

### **Step 1.4: Basic Server Setup**

**`server.js`**
```javascript
require('dotenv').config()
const app = require('./app')
require('./models/db')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`📸 Instagram Clone server running on port ${PORT}`)
})
```

**`app.js`**
```javascript
const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')

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

module.exports = app
```

### **Discussion Questions:**
1. Why do we need separate directories for controllers, models, and views?
2. What is the purpose of the `public` directory?
3. How does the MVC pattern help organize our code?

---

## 🗄️ **Lesson 2: Database Models & Relationships**

### **Learning Objective:** Design and implement database models with proper relationships

### **Step 2.1: User Model**

**`models/user.js`**
```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  fullName: { type: String, required: true, trim: true },
  bio: { type: String, maxlength: 150, default: '' },
  profilePicture: { type: String, default: '/images/default-avatar.png' },
  website: { type: String, trim: true },
  location: { type: String, trim: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  isPrivate: { type: Boolean, default: false }
}, { timestamps: true })

userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8)
  }
  next()
})

userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET)
  return token
}

userSchema.methods.follow = async function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId)
    await this.save()
  }
}

userSchema.methods.unfollow = async function(userId) {
  this.following = this.following.filter(id => id.toString() !== userId.toString())
  await this.save()
}

const User = mongoose.model('User', userSchema)
module.exports = User
```

### **Step 2.2: Post Model**

**`models/post.js`**
```javascript
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String, required: true },
  caption: { type: String, maxlength: 2200, trim: true },
  location: { type: String, trim: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tags: [{ type: String, trim: true }],
  isPrivate: { type: Boolean, default: false }
}, { timestamps: true })

postSchema.virtual('likeCount').get(function() {
  return this.likes.length
})

postSchema.virtual('commentCount').get(function() {
  return this.comments.length
})

postSchema.set('toJSON', { virtuals: true })

const Post = mongoose.model('Post', postSchema)
module.exports = Post
```

### **Step 2.3: Comment Model**

**`models/comment.js`**
```javascript
const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true, maxlength: 1000, trim: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)
module.exports = Comment
```

### **Discussion Questions:**
1. Why do we use references instead of embedding data?
2. How do virtual properties help us?
3. What are the benefits of using timestamps?

---

## 🔐 **Lesson 3: Authentication System**

### **Learning Objective:** Implement secure user authentication with JWT

### **Step 3.1: Authentication Middleware**

**`controllers/auth/dataController.js`**
```javascript
const User = require('../../models/user')
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

exports.createUser = async (req, res, next) => {
  try {
    const user = new User(req.body)
    await user.save()
    const token = await user.generateAuthToken()
    res.locals.data.token = token
    req.user = user
    next()
  } catch(error){
    res.status(400).json({message: error.message})
  }
}

exports.loginUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    })
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
```

### **Step 3.2: Authentication Views**

**`views/auth/SignUp.jsx`**
```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignUp() {
  return (
    <Layout>
      <div className="auth-container">
        <div className="auth-card">
          <h1>Instagram Clone</h1>
          <h2>Sign up to see photos and videos from your friends.</h2>
          
          <form action="/users/signup" method="POST" className="auth-form">
            <div className="form-group">
              <input type="email" name="email" placeholder="Email" required className="auth-input" />
            </div>
            <div className="form-group">
              <input type="text" name="fullName" placeholder="Full Name" required className="auth-input" />
            </div>
            <div className="form-group">
              <input type="text" name="username" placeholder="Username" required className="auth-input" />
            </div>
            <div className="form-group">
              <input type="password" name="password" placeholder="Password" required className="auth-input" />
            </div>
            <button type="submit" className="auth-button">Sign Up</button>
          </form>
          
          <p className="auth-link">
            Have an account? <a href="/users/login">Log in</a>
          </p>
        </div>
      </div>
    </Layout>
  )
}

module.exports = SignUp
```

### **Discussion Questions:**
1. Why do we use JWT tokens instead of sessions?
2. How does bcrypt help secure passwords?
3. What are the benefits of using middleware?

---

## 📸 **Lesson 4: File Upload & Post Creation**

### **Learning Objective:** Implement file upload functionality and post creation

### **Step 4.1: File Upload Middleware**

**`middleware/upload.js`**
```javascript
const multer = require('multer')
const path = require('path')
const sharp = require('sharp')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

const processImage = async (req, res, next) => {
  if (!req.file) return next()

  try {
    const filename = req.file.filename
    const filepath = path.join(process.env.UPLOAD_PATH, filename)
    
    await sharp(filepath)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(path.join(process.env.UPLOAD_PATH, 'processed-' + filename))
    
    req.file.filename = 'processed-' + filename
    req.file.path = '/uploads/' + req.file.filename
    
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { upload, processImage }
```

### **Step 4.2: Post Data Controller**

**`controllers/posts/dataController.js`**
```javascript
const Post = require('../../models/post')
const User = require('../../models/user')

const dataController = {}

dataController.index = async (req, res, next) => {
  try {
    const currentUser = req.user
    const followingIds = currentUser.following
    followingIds.push(currentUser._id)
    
    res.locals.data.posts = await Post.find({
      author: { $in: followingIds },
      isPrivate: false
    })
    .populate('author', 'username fullName profilePicture')
    .populate('likes', 'username')
    .populate({
      path: 'comments',
      populate: { path: 'author', select: 'username fullName profilePicture' }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    
    next()
  } catch(error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.create = async (req, res, next) => {
  try {
    req.body.author = req.user._id
    req.body.image = req.file.path
    
    res.locals.data.post = await Post.create(req.body)
    
    req.user.posts.push(res.locals.data.post._id)
    await req.user.save()
    
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    const userId = req.user._id
    
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString())
    } else {
      post.likes.push(userId)
    }
    
    await post.save()
    res.locals.data.post = post
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

module.exports = dataController
```

### **Discussion Questions:**
1. Why do we process images before storing them?
2. How does multer help with file uploads?
3. What are the security considerations for file uploads?

---

## 🎨 **Lesson 5: User Interface & Styling**

### **Learning Objective:** Create a responsive and modern Instagram-like interface

### **Step 5.1: Feed Component**

**`views/posts/Feed.jsx`**
```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Feed(props) {
  const { posts } = props
  const token = props.token

  return (
    <Layout>
      <div className="feed-container">
        <div className="feed-header">
          <h1>Instagram Clone</h1>
          <a href={`/posts/new?token=${token}`} className="new-post-btn">
            <i className="fas fa-plus"></i> New Post
          </a>
        </div>
        
        <div className="posts-container">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <img src={post.author.profilePicture} alt={post.author.username} className="author-avatar" />
                  <span className="author-name">{post.author.username}</span>
                </div>
              </div>
              
              <div className="post-image">
                <img src={post.image} alt={post.caption} />
              </div>
              
              <div className="post-actions-bar">
                <div className="action-buttons">
                  <button className="action-btn like-btn">
                    <i className="far fa-heart"></i>
                  </button>
                  <button className="action-btn">
                    <i className="far fa-comment"></i>
                  </button>
                  <button className="action-btn">
                    <i className="far fa-paper-plane"></i>
                  </button>
                </div>
                <button className="action-btn save-btn">
                  <i className="far fa-bookmark"></i>
                </button>
              </div>
              
              <div className="post-likes">
                <span className="likes-count">{post.likeCount} likes</span>
              </div>
              
              <div className="post-caption">
                <span className="caption-author">{post.author.username}</span>
                <span className="caption-text">{post.caption}</span>
              </div>
              
              <div className="post-timestamp">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

module.exports = Feed
```

### **Step 5.2: CSS Styling**

**`public/styles.css`**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #fafafa;
    color: #262626;
    line-height: 1.5;
}

.app-container {
    max-width: 935px;
    margin: 0 auto;
    padding: 0 20px;
}

.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #fafafa;
}

.auth-card {
    background: white;
    border: 1px solid #dbdbdb;
    border-radius: 1px;
    padding: 40px;
    text-align: center;
    max-width: 350px;
    width: 100%;
}

.auth-card h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 300;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.auth-input {
    width: 100%;
    padding: 9px 0 7px 8px;
    border: 1px solid #dbdbdb;
    border-radius: 3px;
    background: #fafafa;
    font-size: 0.9rem;
}

.auth-button {
    background: #0095f6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
}

.post-card {
    background: white;
    border: 1px solid #dbdbdb;
    border-radius: 3px;
    margin-bottom: 2rem;
}

.post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
}

.post-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.author-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.post-image img {
    width: 100%;
    height: auto;
    display: block;
}

.post-actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
}

.action-buttons {
    display: flex;
    gap: 1rem;
}

.action-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #262626;
    padding: 8px;
}

.post-caption {
    padding: 0 16px;
    margin-bottom: 0.5rem;
}

.caption-author {
    font-weight: 600;
    margin-right: 0.5rem;
}
```

### **Discussion Questions:**
1. Why is responsive design important for social media apps?
2. How does CSS Grid/Flexbox help with layout?
3. What are the benefits of using CSS variables?

---

## 🧪 **Lesson 6: Testing & Quality Assurance**

### **Learning Objective:** Write comprehensive tests for the application

### **Step 6.1: User Tests**

**`tests/user.test.js`**
```javascript
const request = require('supertest')
const app = require('../app')
const User = require('../models/user')
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
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User'
    }

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201)

    expect(response.body.user).toBeDefined()
    expect(response.body.user.username).toBe(userData.username)
    expect(response.body.user.password).toBeUndefined()
    expect(response.body.token).toBeDefined()
  })

  test('POST /api/users/login - should login user with username', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User'
    })
    await user.save()

    const response = await request(app)
      .post('/api/users/login')
      .send({
        username: 'testuser',
        password: 'password123'
      })
      .expect(200)

    expect(response.body.user).toBeDefined()
    expect(response.body.token).toBeDefined()
  })
})
```

### **Discussion Questions:**
1. Why is testing important for social media applications?
2. What are the benefits of using MongoDB Memory Server?
3. How do we test file uploads?

---

## 🚀 **Lesson 7: Deployment & Final Steps**

### **Learning Objective:** Deploy the application and understand production considerations

### **Step 7.1: Environment Setup**

```bash
# Create production .env file
echo "PORT=3000
MONGODB_URI=mongodb://localhost:27017/instagram_clone
JWT_SECRET=your-super-secret-production-key
UPLOAD_PATH=public/uploads" > .env
```

### **Step 7.2: Start Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### **Step 7.3: Production Considerations**

**Security Checklist:**
- [ ] Environment variables properly set
- [ ] JWT secret is strong and unique
- [ ] File upload validation implemented
- [ ] Input sanitization in place
- [ ] CORS properly configured
- [ ] Rate limiting implemented

**Performance Checklist:**
- [ ] Images are optimized and compressed
- [ ] Database indexes are created
- [ ] Caching strategy implemented
- [ ] CDN for static assets
- [ ] Database connection pooling

### **Discussion Questions:**
1. What are the security considerations for social media apps?
2. How do we handle scalability in production?
3. What monitoring tools should we use?

---

## 🎯 **Lesson Summary & Next Steps**

### **What We've Built:**
- ✅ Complete user authentication system
- ✅ Photo upload and sharing functionality
- ✅ Like and comment systems
- ✅ User profiles and following
- ✅ Responsive Instagram-like interface
- ✅ Comprehensive testing suite

### **Advanced Features to Add:**
1. **Real-time Notifications** - WebSocket integration
2. **Direct Messaging** - Chat functionality
3. **Stories Feature** - 24-hour content
4. **Explore Page** - Discover new content
5. **Search Functionality** - Find users and posts
6. **Mobile App** - React Native implementation

### **Final Discussion:**
1. How does this compare to the original fruits application?
2. What patterns did we reuse from the fruits app?
3. What new patterns did we learn for social media apps?
4. How would you extend this application further?

This lesson provides a complete foundation for building a social media application with modern web technologies. Students can follow this guide to create a fully functional Instagram clone that demonstrates real-world development practices! 