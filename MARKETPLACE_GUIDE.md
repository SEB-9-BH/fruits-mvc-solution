# Market-place Application: Complete Student Guide

## 🎯 **Project Overview**

**Market-place** is an e-commerce platform where users can list items for sale and purchase items from other users. Users can browse items, create listings, and manage their marketplace inventory.

**Learning Goals:**
- Build a full-stack e-commerce application
- Implement user authentication and authorization
- Create item listing and management system
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
mkdir market-place
cd market-place

# Initialize npm project
npm init -y

# Create directory structure
mkdir controllers models routes views tests public
mkdir controllers/auth controllers/items
mkdir views/auth views/items views/layouts
mkdir public/css public/images
```

### **1.2 Install Dependencies**

```bash
# Install core dependencies
npm install express mongoose dotenv jsx-view-engine method-override morgan bcrypt jsonwebtoken

# Install development dependencies
npm install --save-dev jest supertest mongodb-memory-server artillery@1.7.9
```

### **1.3 Create Basic Configuration Files**

**`.env`**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/marketplace
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

### **2.1 User Model (`models/user.js`)**

```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  location: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
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

const User = mongoose.model('User', userSchema)
module.exports = User
```

### **2.2 Item Model (`models/item.js`)**

```javascript
const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other']
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  images: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

const Item = mongoose.model('Item', itemSchema)
module.exports = Item
```

### **2.3 Database Connection (`models/db.js`)**

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

## 🛣️ **Step 3: Controllers**

### **3.1 User Data Controller (`controllers/auth/dataController.js`)**

```javascript
const User = require('../../models/user')
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

### **3.2 User View Controller (`controllers/auth/viewController.js`)**

```javascript
const User = require('../../models/user')

// Show signup form
exports.signUp = (req, res) => {
  res.render('auth/SignUp')
}

// Show login form
exports.signIn = (req, res) => {
  res.render('auth/SignIn')
}

// Show user profile
exports.showProfile = async (req, res) => {
  try {
    await req.user.populate('items')
    res.render('auth/Profile', { user: req.user })
  } catch (error) {
    res.status(400).send(error.message)
  }
}
```

### **3.3 User API Controller (`controllers/auth/apiController.js`)**

```javascript
const User = require('../../models/user')
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

// API Get user profile
exports.getProfile = async (req, res) => {
  try {
    await req.user.populate('items')
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

### **3.4 Item Data Controller (`controllers/items/dataController.js`)**

```javascript
const Item = require('../../models/item')

const dataController = {}

// Get all items
dataController.index = async (req, res, next) => {
  try {
    const filter = { isAvailable: true }
    if (req.query.category) {
      filter.category = req.query.category
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    res.locals.data.items = await Item.find(filter)
      .populate('seller', 'name location')
      .sort({ createdAt: -1 })
    next()
  } catch(error) {
    res.status(400).send({ message: error.message })
  }
}

// Get single item
dataController.show = async (req, res, next) => {
  try {
    res.locals.data.item = await Item.findById(req.params.id)
      .populate('seller', 'name location phone')
    if(!res.locals.data.item){
      throw new Error(`Could not locate an item with the id ${req.params.id}`)
    }
    // Increment views
    res.locals.data.item.views += 1
    await res.locals.data.item.save()
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Create new item
dataController.create = async (req, res, next) => {
  try {
    req.body.seller = req.user._id
    res.locals.data.item = await Item.create(req.body)
    req.user.items.addToSet({_id: res.locals.data.item._id })
    await req.user.save()
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Update item
dataController.update = async (req, res, next) => {
  try {
    res.locals.data.item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Delete item
dataController.destroy = async (req, res, next) => {
  try {
    await Item.findOneAndDelete({'_id': req.params.id })
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

module.exports = dataController
```

### **3.5 Item View Controller (`controllers/items/viewController.js`)**

```javascript
// Show all items
exports.index = (req, res) => {
  res.render('items/Index', { items: res.locals.data.items })
}

// Show single item
exports.show = (req, res) => {
  res.render('items/Show', { item: res.locals.data.item })
}

// Show new item form
exports.new = (req, res) => {
  res.render('items/New')
}

// Show edit item form
exports.edit = (req, res) => {
  res.render('items/Edit', { item: res.locals.data.item })
}
```

### **3.6 Item API Controller (`controllers/items/apiController.js`)**

```javascript
// API Item controllers - returns JSON responses
const apiController = {
  // Get all items
  index(req, res) {
    res.json(res.locals.data.items)
  },

  // Get single item
  show(req, res) {
    res.json(res.locals.data.item)
  },

  // Create new item
  create(req, res) {
    res.status(201).json(res.locals.data.item)
  },

  // Update item
  update(req, res) {
    res.json(res.locals.data.item)
  },

  // Delete item
  destroy(req, res) {
    res.status(200).json({ message: 'Item successfully deleted' })
  }
}

module.exports = apiController
```

---

## 🛣️ **Step 4: Routes**

### **4.1 User Routes (`controllers/auth/routeController.js`)**

```javascript
const express = require('express')
const router = express.Router()
const userDataController = require('./dataController')
const userViewController = require('./viewController')

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

### **4.2 Item Routes (`controllers/items/routeController.js`)**

```javascript
const express = require('express')
const router = express.Router()
const itemDataController = require('./dataController')
const itemViewController = require('./viewController')
const userDataController = require('../auth/dataController')

// Web routes
router.get('/', itemDataController.index, itemViewController.index)
router.get('/new', userDataController.auth, itemViewController.new)
router.post('/', userDataController.auth, itemDataController.create, itemViewController.show)
router.get('/:id', itemDataController.show, itemViewController.show)
router.get('/:id/edit', userDataController.auth, itemDataController.show, itemViewController.edit)
router.put('/:id', userDataController.auth, itemDataController.update, itemViewController.show)
router.delete('/:id', userDataController.auth, itemDataController.destroy)

module.exports = router
```

### **4.3 API Routes (`routes/apiRoutes.js`)**

```javascript
const express = require('express')
const router = express.Router()
const userApiController = require('../controllers/auth/apiController')
const itemApiController = require('../controllers/items/apiController')
const itemDataController = require('../controllers/items/dataController')

// User API Routes
router.post('/users', userApiController.createUser)
router.post('/users/login', userApiController.loginUser)
router.get('/users/profile', userApiController.auth, userApiController.getProfile)
router.put('/users/:id', userApiController.auth, userApiController.updateUser)
router.delete('/users/:id', userApiController.auth, userApiController.deleteUser)

// Item API Routes
router.get('/items', itemDataController.index, itemApiController.index)
router.get('/items/:id', itemDataController.show, itemApiController.show)
router.post('/items', userApiController.auth, itemDataController.create, itemApiController.create)
router.put('/items/:id', userApiController.auth, itemDataController.update, itemApiController.update)
router.delete('/items/:id', userApiController.auth, itemDataController.destroy, itemApiController.destroy)

module.exports = router
```

---

## 🎨 **Step 5: Views**

### **5.1 Layout (`views/layouts/Layout.jsx`)**

```javascript
const React = require('react')

function Layout(props){
  return(
    <html>
      <head>
        <title>{!props.item?.title ? 'Market-place - Buy & Sell' : `${props.item.title} - Market-place`}</title>
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

### **5.2 Sign Up (`views/auth/SignUp.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignUp() {
  return (
    <Layout>
      <div className="auth-container">
        <h1>Join Market-place</h1>
        <form action="/users/signup" method="POST">
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
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
            <label htmlFor="location">Location:</label>
            <input type="text" id="location" name="location" required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone (optional):</label>
            <input type="tel" id="phone" name="phone" />
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

### **5.3 Sign In (`views/auth/SignIn.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function SignIn() {
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

module.exports = SignIn
```

### **5.4 Items Index (`views/items/Index.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Index(props) {
  const { items } = props
  const token = props.token

  return (
    <Layout>
      <div className="marketplace-container">
        <div className="header">
          <h1>Market-place</h1>
          {token && (
            <a href={`/items/new?token=${token}`} className="btn btn-primary">List Item</a>
          )}
        </div>
        
        <div className="search-filter">
          <form method="GET" className="search-form">
            <input 
              type="text" 
              name="search" 
              placeholder="Search items..." 
              defaultValue={props.search || ''}
            />
            <select name="category" defaultValue={props.category || ''}>
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit" className="btn btn-secondary">Filter</button>
          </form>
        </div>

        <div className="items-grid">
          {items.map(item => (
            <div key={item._id} className="item-card">
              <div className="item-image">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.title} />
                ) : (
                  <div className="placeholder-image">No Image</div>
                )}
              </div>
              <div className="item-info">
                <h3 className="item-title">{item.title}</h3>
                <p className="item-price">${item.price}</p>
                <p className="item-location">{item.location}</p>
                <p className="item-condition">{item.condition}</p>
                <div className="item-footer">
                  <span className="views">Views: {item.views}</span>
                  <a href={`/items/${item._id}`} className="btn btn-secondary">View Details</a>
                </div>
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

### **5.5 New Item (`views/items/New.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function New(props) {
  const token = props.token

  return (
    <Layout>
      <div className="form-container">
        <h1>List Your Item</h1>
        <form action={`/items?token=${token}`} method="POST">
          <div className="form-group">
            <label htmlFor="title">Item Title:</label>
            <input type="text" id="title" name="title" required maxLength="100" />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" required maxLength="1000" rows="6"></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($):</label>
              <input type="number" id="price" name="price" required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select id="category" name="category" required>
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home">Home</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="condition">Condition:</label>
              <select id="condition" name="condition" required>
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location:</label>
              <input type="text" id="location" name="location" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="images">Image URLs (one per line):</label>
            <textarea id="images" name="images" rows="3" placeholder="https://example.com/image1.jpg"></textarea>
          </div>
          <button type="submit" className="btn btn-primary">List Item</button>
          <a href={`/items?token=${token}`} className="btn btn-secondary">Cancel</a>
        </form>
      </div>
    </Layout>
  )
}

module.exports = New
```

---

## 🧪 **Step 6: Testing**

### **6.1 Item Tests (`tests/item.test.js`)**

```javascript
const request = require('supertest')
const app = require('../app')
const Item = require('../models/item')
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
  await Item.deleteMany({})
  await User.deleteMany({})
})

describe('Item API', () => {
  test('GET /api/items - should get all items', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      location: 'Test City'
    })
    await user.save()

    const item = new Item({
      seller: user._id,
      title: 'Test Item',
      description: 'Test description',
      price: 50,
      category: 'Electronics',
      condition: 'Good',
      location: 'Test City'
    })
    await item.save()

    const response = await request(app)
      .get('/api/items')
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0].title).toBe('Test Item')
  })

  test('POST /api/items - should create new item', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      location: 'Test City'
    })
    await user.save()
    const token = await user.generateAuthToken()

    const itemData = {
      title: 'New Item',
      description: 'New description',
      price: 100,
      category: 'Electronics',
      condition: 'New',
      location: 'Test City'
    }

    const response = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send(itemData)
      .expect(201)

    expect(response.body.title).toBe(itemData.title)
    expect(response.body.seller).toBe(user._id.toString())
  })
})
```

---

## 🎨 **Step 7: Styling**

### **7.1 CSS (`public/styles.css`)**

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

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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
input[type="number"],
input[type="tel"],
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
input[type="number"]:focus,
input[type="tel"]:focus,
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

/* Marketplace */
.marketplace-container {
    max-width: 1000px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.search-filter {
    margin-bottom: 2rem;
}

.search-form {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.search-form input,
.search-form select {
    flex: 1;
}

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.item-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.item-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.item-image {
    height: 200px;
    background: #f7fafc;
    display: flex;
    align-items: center;
    justify-content: center;
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.placeholder-image {
    color: #718096;
    font-size: 1.2rem;
}

.item-info {
    padding: 1.5rem;
}

.item-title {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: #2d3748;
}

.item-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 0.5rem;
}

.item-location,
.item-condition {
    color: #718096;
    margin-bottom: 0.25rem;
}

.item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
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

## 🚀 **Step 8: Application Setup**

### **8.1 App Configuration (`app.js`)**

```javascript
const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const userRoutes = require('./controllers/auth/routeController')
const itemRoutes = require('./controllers/items/routeController')
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
app.use('/items', itemRoutes)

// API routes
app.use('/api', apiRoutes)

// Home route
app.get('/', (req, res) => {
    res.redirect('/items')
})

module.exports = app
```

### **8.2 Server (`server.js`)**

```javascript
require('dotenv').config()
const app = require('./app')
require('./models/db')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`🚀 Market-place server running on port ${PORT}`)
})
```

---

## 📋 **Step 9: Final Steps**

### **9.1 Environment Setup**

```bash
# Create .env file
echo "PORT=3000
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=your-super-secret-key-here" > .env
```

### **9.2 Start Development**

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
- [ ] User registration and authentication
- [ ] Item listing and management
- [ ] Search and filter functionality
- [ ] Item details and views tracking
- [ ] User profiles and item collections
- [ ] Responsive design and styling

### **Advanced Features (Optional):**
- [ ] Image upload functionality
- [ ] Messaging between users
- [ ] Payment integration
- [ ] Item categories and tags
- [ ] User ratings and reviews
- [ ] Advanced search filters

### **Testing:**
- [ ] User API tests
- [ ] Item API tests
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
node -e "console.log(require('./models/item.js'))"
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

1. **Add Image Upload**: Implement file upload functionality
2. **Add Messaging**: Create chat system between buyers and sellers
3. **Add Payment System**: Integrate payment processing
4. **Add User Reviews**: Implement rating and review system
5. **Add Notifications**: Create notification system for new items
6. **Add Advanced Search**: Implement filters and sorting
7. **Add Mobile App**: Create React Native mobile app
8. **Add Analytics**: Implement user and item analytics

This guide provides a complete foundation for building the Market-place e-commerce application. Follow each step carefully, test frequently, and don't hesitate to refer to the debug guide if you encounter issues! 