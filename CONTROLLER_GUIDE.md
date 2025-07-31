# Controller Guide: Function-by-Function Breakdown

This document provides a comprehensive breakdown of every function in the dataControllers and apiControllers, with line-by-line explanations and blog application examples.

---

## 🔐 Auth Data Controller (`controllers/auth/dataController.js`)

### **1. `exports.auth` - Authentication Middleware**

#### **Full Function**
```javascript
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
}
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.auth = async (req, res, next) => {`
- **Purpose**: Export authentication middleware function
- **Parameters**: `req` (request), `res` (response), `next` (next middleware)
- **Blog Example**: Used to protect blog routes requiring user authentication

**Line 2**: `try {`
- **Purpose**: Start error handling block
- **Blog Example**: Catches authentication errors gracefully

**Line 3**: `let token`
- **Purpose**: Declare variable to store authentication token
- **Blog Example**: Will hold JWT token for blog user authentication

**Lines 4-8**: Token extraction logic
```javascript
if(req.query.token){
  token = req.query.token
}else if(req.header('Authorization')){
  token = req.header('Authorization').replace('Bearer ', '')
}else {
  throw new Error('No token provided')
}
```
- **Purpose**: Extract token from query parameters or Authorization header
- **Blog Example**: Supports both web views (query params) and API calls (headers)

**Line 9**: `const data = jwt.verify(token, 'secret')`
- **Purpose**: Verify JWT token and extract user data
- **Blog Example**: Decodes token to get blog user ID

**Line 10**: `const user = await User.findOne({ _id: data._id })`
- **Purpose**: Find user in database using token data
- **Blog Example**: Finds blog author by ID from token

**Lines 11-13**: User validation
```javascript
if (!user) {
  throw new Error()
}
```
- **Purpose**: Ensure user exists in database
- **Blog Example**: Confirms blog author still exists

**Line 14**: `req.user = user`
- **Purpose**: Attach user to request object
- **Blog Example**: Makes blog author available to subsequent middleware

**Line 15**: `res.locals.data.token = token`
- **Purpose**: Store token in response locals for views
- **Blog Example**: Passes token to blog templates for navigation

**Line 16**: `next()`
- **Purpose**: Continue to next middleware/controller
- **Blog Example**: Proceeds to blog post controller

**Lines 17-19**: Error handling
```javascript
} catch (error) {
  res.status(401).send('Not authorized')
}
```
- **Purpose**: Handle authentication failures
- **Blog Example**: Returns unauthorized error for invalid tokens

#### **When to Use**
- **Web Routes**: Protects blog post creation, editing, deletion
- **API Routes**: Protects blog API endpoints
- **Placement**: Before any controller that needs authentication

#### **Blog Application Example**
```javascript
// Blog route with authentication
router.get('/posts/new', authDataController.auth, blogViewController.newPost)
router.post('/posts', authDataController.auth, blogDataController.create, blogViewController.redirectHome)
router.delete('/posts/:id', authDataController.auth, blogDataController.destroy, blogViewController.redirectHome)
```

---

### **2. `exports.createUser` - User Registration**

#### **Full Function**
```javascript
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
}
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.createUser = async (req, res, next) => {`
- **Purpose**: Export user creation function
- **Blog Example**: Creates new blog author account

**Line 2**: `try{`
- **Purpose**: Start error handling
- **Blog Example**: Catches registration errors

**Line 3**: `const user = new User(req.body)`
- **Purpose**: Create new User instance from form data
- **Blog Example**: Creates blog author from registration form

**Line 4**: `await user.save()`
- **Purpose**: Save user to database (triggers password hashing)
- **Blog Example**: Stores blog author in database

**Line 5**: `const token = await user.generateAuthToken()`
- **Purpose**: Generate JWT token for new user
- **Blog Example**: Creates authentication token for blog author

**Line 6**: `res.locals.data.token = token`
- **Purpose**: Store token for view templates
- **Blog Example**: Passes token to blog templates

**Line 7**: `req.user = user`
- **Purpose**: Attach user to request
- **Blog Example**: Makes blog author available to next middleware

**Line 8**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to redirect or view controller

**Lines 9-11**: Error handling
```javascript
} catch(error){
  res.status(400).json({message: error.message})
}
```
- **Purpose**: Handle registration errors
- **Blog Example**: Returns error for duplicate emails, invalid data

#### **When to Use**
- **Web Routes**: User registration forms
- **API Routes**: User creation endpoints
- **Placement**: After form validation, before view controller

#### **Blog Application Example**
```javascript
// Blog author registration
router.post('/authors', blogDataController.createUser, blogViewController.redirectToLogin)
```

---

### **3. `exports.loginUser` - User Authentication**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.loginUser = async (req, res, next) => {`
- **Purpose**: Export login function
- **Blog Example**: Authenticates blog authors

**Line 2**: `try{`
- **Purpose**: Start error handling
- **Blog Example**: Catches login errors

**Line 3**: `const user = await User.findOne({ email: req.body.email })`
- **Purpose**: Find user by email address
- **Blog Example**: Finds blog author by email

**Line 4**: Password verification
```javascript
if (!user || !await bcrypt.compare(req.body.password, user.password)) {
```
- **Purpose**: Check if user exists and password matches
- **Blog Example**: Verifies blog author credentials

**Line 5**: `res.status(400).send('Invalid login credentials')`
- **Purpose**: Return error for invalid credentials
- **Blog Example**: Shows error for wrong email/password

**Lines 6-9**: Successful login
```javascript
} else {
  const token = await user.generateAuthToken()
  res.locals.data.token = token 
  req.user = user
  next()
}
```
- **Purpose**: Generate token and continue for valid credentials
- **Blog Example**: Creates session for blog author

**Lines 10-12**: Error handling
```javascript
} catch(error){
  res.status(400).json({message: error.message})
}
```
- **Purpose**: Handle login errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **Web Routes**: Login forms
- **API Routes**: Authentication endpoints
- **Placement**: After form submission, before redirect

#### **Blog Application Example**
```javascript
// Blog author login
router.post('/authors/login', blogDataController.loginUser, blogViewController.redirectHome)
```

---

### **4. `exports.updateUser` - User Profile Update**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.updateUser = async (req, res) => {`
- **Purpose**: Export user update function
- **Blog Example**: Updates blog author profile

**Line 2**: `try{`
- **Purpose**: Start error handling
- **Blog Example**: Catches update errors

**Line 3**: `const updates = Object.keys(req.body)`
- **Purpose**: Get array of fields to update
- **Blog Example**: Identifies which blog author fields to change

**Line 4**: `const user = await User.findOne({ _id: req.params.id })`
- **Purpose**: Find user by ID
- **Blog Example**: Finds blog author by ID

**Line 5**: `updates.forEach(update => user[update] = req.body[update])`
- **Purpose**: Update each field with new value
- **Blog Example**: Updates blog author name, bio, etc.

**Line 6**: `await user.save()`
- **Purpose**: Save changes to database
- **Blog Example**: Persists blog author changes

**Line 7**: `res.json(user)`
- **Purpose**: Return updated user data
- **Blog Example**: Returns updated blog author information

**Lines 8-10**: Error handling
```javascript
}catch(error){
  res.status(400).json({message: error.message})
}
```
- **Purpose**: Handle update errors
- **Blog Example**: Returns error for invalid data

#### **When to Use**
- **API Routes**: User profile updates
- **Placement**: After authentication, before response

#### **Blog Application Example**
```javascript
// Update blog author profile
router.put('/api/authors/:id', blogApiController.auth, blogApiController.updateAuthor)
```

---

### **5. `exports.deleteUser` - User Account Deletion**

#### **Full Function**
```javascript
exports.deleteUser = async (req, res) => {
  try{
    await req.user.deleteOne()
    res.json({ message: 'User deleted' })
  }catch(error){
    res.status(400).json({message: error.message})
  }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.deleteUser = async (req, res) => {`
- **Purpose**: Export user deletion function
- **Blog Example**: Deletes blog author account

**Line 2**: `try{`
- **Purpose**: Start error handling
- **Blog Example**: Catches deletion errors

**Line 3**: `await req.user.deleteOne()`
- **Purpose**: Delete user from database
- **Blog Example**: Removes blog author and all their posts

**Line 4**: `res.json({ message: 'User deleted' })`
- **Purpose**: Return success message
- **Blog Example**: Confirms blog author deletion

**Lines 5-7**: Error handling
```javascript
}catch(error){
  res.status(400).json({message: error.message})
}
```
- **Purpose**: Handle deletion errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **API Routes**: Account deletion
- **Placement**: After authentication, before response

#### **Blog Application Example**
```javascript
// Delete blog author account
router.delete('/api/authors/:id', blogApiController.auth, blogApiController.deleteAuthor)
```

---

## 🍎 Fruit Data Controller (`controllers/fruits/dataController.js`)

### **1. `dataController.index` - List All Items**

#### **Full Function**
```javascript
dataController.index = async (req,res,next) => {
   try {
    const user = await req.user.populate('fruits')
    res.locals.data.fruits = user.fruits
    next()
   } catch(error) {
    res.status(400).send({ message: error.message })
  }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `dataController.index = async (req,res,next) => {`
- **Purpose**: Export index function for listing items
- **Blog Example**: Lists all blog posts for authenticated author

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches data retrieval errors

**Line 3**: `const user = await req.user.populate('fruits')`
- **Purpose**: Get user with populated related data
- **Blog Example**: Gets blog author with all their posts

**Line 4**: `res.locals.data.fruits = user.fruits`
- **Purpose**: Store data for view templates
- **Blog Example**: Makes blog posts available to templates

**Line 5**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to view controller

**Lines 6-8**: Error handling
```javascript
} catch(error) {
  res.status(400).send({ message: error.message })
}
```
- **Purpose**: Handle data retrieval errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **Web Routes**: Display user's items
- **Placement**: After authentication, before view controller

#### **Blog Application Example**
```javascript
// List all blog posts for author
router.get('/posts', authDataController.auth, blogDataController.index, blogViewController.index)
```

---

### **2. `dataController.create` - Create New Item**

#### **Full Function**
```javascript
dataController.create = async (req, res, next) => {
    if(req.body.readyToEat === 'on'){
        req.body.readyToEat = true;
    } else if(req.body.readyToEat !== true) {
        req.body.readyToEat = false;
    }
    try {
      res.locals.data.fruit = await Fruit.create(req.body)
      req.user.fruits.addToSet({_id: res.locals.data.fruit._id })
      await req.user.save()
      next()
    } catch (error) {
      res.status(400).send({ message: error.message })
    }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `dataController.create = async (req, res, next) => {`
- **Purpose**: Export create function
- **Blog Example**: Creates new blog post

**Lines 2-6**: Checkbox handling
```javascript
if(req.body.readyToEat === 'on'){
    req.body.readyToEat = true;
} else if(req.body.readyToEat !== true) {
    req.body.readyToEat = false;
}
```
- **Purpose**: Convert checkbox 'on' to boolean true/false
- **Blog Example**: Converts "published" checkbox to boolean

**Line 7**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches creation errors

**Line 8**: `res.locals.data.fruit = await Fruit.create(req.body)`
- **Purpose**: Create new item in database
- **Blog Example**: Creates new blog post in database

**Line 9**: `req.user.fruits.addToSet({_id: res.locals.data.fruit._id })`
- **Purpose**: Add item to user's collection (prevents duplicates)
- **Blog Example**: Adds post to author's posts array

**Line 10**: `await req.user.save()`
- **Purpose**: Save user with new item reference
- **Blog Example**: Updates author with new post reference

**Line 11**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to redirect or view controller

**Lines 12-14**: Error handling
```javascript
} catch (error) {
  res.status(400).send({ message: error.message })
}
```
- **Purpose**: Handle creation errors
- **Blog Example**: Returns error for invalid post data

#### **When to Use**
- **Web Routes**: Form submissions for new items
- **Placement**: After authentication, before redirect

#### **Blog Application Example**
```javascript
// Create new blog post
router.post('/posts', authDataController.auth, blogDataController.create, blogViewController.redirectHome)
```

---

### **3. `dataController.show` - Get Single Item**

#### **Full Function**
```javascript
dataController.show = async (req, res, next) => {
    try {
        res.locals.data.fruit = await Fruit.findById(req.params.id)
        if(!res.locals.data.fruit){
            throw new error(`could not locate a fruit with the id ${req.params.id}`)
        }
        next()
    } catch (error) {
      res.status(400).send({ message: error.message })
    }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `dataController.show = async (req, res, next) => {`
- **Purpose**: Export show function for single item
- **Blog Example**: Gets single blog post

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches retrieval errors

**Line 3**: `res.locals.data.fruit = await Fruit.findById(req.params.id)`
- **Purpose**: Find item by ID
- **Blog Example**: Finds blog post by ID

**Lines 4-6**: Item validation
```javascript
if(!res.locals.data.fruit){
    throw new error(`could not locate a fruit with the id ${req.params.id}`)
}
```
- **Purpose**: Ensure item exists
- **Blog Example**: Confirms blog post exists

**Line 7**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to view controller

**Lines 8-10**: Error handling
```javascript
} catch (error) {
  res.status(400).send({ message: error.message })
}
```
- **Purpose**: Handle retrieval errors
- **Blog Example**: Returns error for invalid post ID

#### **When to Use**
- **Web Routes**: Display single item details
- **Placement**: After authentication, before view controller

#### **Blog Application Example**
```javascript
// Show single blog post
router.get('/posts/:id', authDataController.auth, blogDataController.show, blogViewController.show)
```

---

### **4. `dataController.update` - Update Item**

#### **Full Function**
```javascript
dataController.update = async (req, res, next) => {
    if(req.body.readyToEat === 'on'){
        req.body.readyToEat = true;
    } else if(req.body.readyToEat !== true) {
        req.body.readyToEat = false;
    }
    try {
      res.locals.data.fruit = await Fruit.findByIdAndUpdate(req.params.id, req.body, { new: true })
      next()
    } catch (error) {
      res.status(400).send({ message: error.message })
    }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `dataController.update = async (req, res, next) => {`
- **Purpose**: Export update function
- **Blog Example**: Updates blog post

**Lines 2-6**: Checkbox handling
```javascript
if(req.body.readyToEat === 'on'){
    req.body.readyToEat = true;
} else if(req.body.readyToEat !== true) {
    req.body.readyToEat = false;
}
```
- **Purpose**: Convert checkbox 'on' to boolean
- **Blog Example**: Converts "published" checkbox to boolean

**Line 7**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches update errors

**Line 8**: `res.locals.data.fruit = await Fruit.findByIdAndUpdate(req.params.id, req.body, { new: true })`
- **Purpose**: Update item and return updated version
- **Blog Example**: Updates blog post and returns new version

**Line 9**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to view controller

**Lines 10-12**: Error handling
```javascript
} catch (error) {
  res.status(400).send({ message: error.message })
}
```
- **Purpose**: Handle update errors
- **Blog Example**: Returns error for invalid update data

#### **When to Use**
- **Web Routes**: Form submissions for item updates
- **Placement**: After authentication, before view controller

#### **Blog Application Example**
```javascript
// Update blog post
router.put('/posts/:id', authDataController.auth, blogDataController.update, blogViewController.redirectShow)
```

---

### **5. `dataController.destroy` - Delete Item**

#### **Full Function**
```javascript
dataController.destroy = async (req, res, next ) => {
    try {
         await Fruit.findOneAndDelete({'_id': req.params.id }).then(() => {
            next()
         })
    } catch (error) {
      res.status(400).send({ message: error.message })
    }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `dataController.destroy = async (req, res, next ) => {`
- **Purpose**: Export destroy function
- **Blog Example**: Deletes blog post

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches deletion errors

**Lines 3-5**: Item deletion
```javascript
await Fruit.findOneAndDelete({'_id': req.params.id }).then(() => {
   next()
})
```
- **Purpose**: Delete item by ID and continue
- **Blog Example**: Removes blog post from database

**Lines 6-8**: Error handling
```javascript
} catch (error) {
  res.status(400).send({ message: error.message })
}
```
- **Purpose**: Handle deletion errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **Web Routes**: Delete item forms/buttons
- **Placement**: After authentication, before redirect

#### **Blog Application Example**
```javascript
// Delete blog post
router.delete('/posts/:id', authDataController.auth, blogDataController.destroy, blogViewController.redirectHome)
```

---

## 🔌 Auth API Controller (`controllers/auth/apiController.js`)

### **1. `exports.auth` - API Authentication Middleware**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.auth = async (req, res, next) => {`
- **Purpose**: Export API authentication middleware
- **Blog Example**: Protects blog API endpoints

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches authentication errors

**Line 3**: `const token = req.header('Authorization').replace('Bearer ', '')`
- **Purpose**: Extract token from Authorization header only
- **Blog Example**: Gets JWT token from API request headers

**Line 4**: `const data = jwt.verify(token, 'secret')`
- **Purpose**: Verify JWT token
- **Blog Example**: Decodes blog author token

**Line 5**: `const user = await User.findOne({ _id: data._id })`
- **Purpose**: Find user in database
- **Blog Example**: Finds blog author by ID

**Lines 6-8**: User validation
```javascript
if (!user) {
  throw new Error()
}
```
- **Purpose**: Ensure user exists
- **Blog Example**: Confirms blog author exists

**Line 9**: `req.user = user`
- **Purpose**: Attach user to request
- **Blog Example**: Makes blog author available to API controllers

**Line 10**: `next()`
- **Purpose**: Continue to next middleware
- **Blog Example**: Proceeds to blog API controller

**Lines 11-13**: Error handling
```javascript
} catch (error) {
  res.status(401).send('Not authorized')
}
```
- **Purpose**: Handle authentication failures
- **Blog Example**: Returns 401 for invalid tokens

#### **When to Use**
- **API Routes**: All protected API endpoints
- **Placement**: Before any API controller that needs authentication

#### **Blog Application Example**
```javascript
// Protected blog API routes
router.get('/api/posts', blogApiController.auth, blogDataController.index, blogApiController.index)
router.post('/api/posts', blogApiController.auth, blogDataController.create, blogApiController.create)
```

---

### **2. `exports.createUser` - API User Creation**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.createUser = async (req, res) => {`
- **Purpose**: Export API user creation function
- **Blog Example**: Creates blog author via API

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches creation errors

**Lines 3-5**: Field validation
```javascript
if (!req.body.name || !req.body.email || !req.body.password) {
  return res.status(400).json({ message: 'Name, email, and password are required' })
}
```
- **Purpose**: Validate required fields
- **Blog Example**: Ensures blog author has name, email, password

**Line 6**: `const user = new User(req.body)`
- **Purpose**: Create new user instance
- **Blog Example**: Creates new blog author

**Line 7**: `await user.save()`
- **Purpose**: Save user to database
- **Blog Example**: Stores blog author in database

**Line 8**: `const token = await user.generateAuthToken()`
- **Purpose**: Generate authentication token
- **Blog Example**: Creates JWT token for blog author

**Line 9**: `res.status(201).json({ user, token })`
- **Purpose**: Return user data and token
- **Blog Example**: Returns blog author info and token

**Lines 10-12**: Error handling
```javascript
} catch (error) {
  res.status(400).json({ message: error.message })
}
```
- **Purpose**: Handle creation errors
- **Blog Example**: Returns error for duplicate emails

#### **When to Use**
- **API Routes**: User registration endpoints
- **Placement**: Direct API endpoint, no middleware needed

#### **Blog Application Example**
```javascript
// Create blog author via API
router.post('/api/authors', blogApiController.createAuthor)
```

---

### **3. `exports.loginUser` - API User Authentication**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.loginUser = async (req, res) => {`
- **Purpose**: Export API login function
- **Blog Example**: Authenticates blog author via API

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches authentication errors

**Line 3**: `const user = await User.findOne({ email: req.body.email })`
- **Purpose**: Find user by email
- **Blog Example**: Finds blog author by email

**Line 4**: Password verification
```javascript
if (!user || !await bcrypt.compare(req.body.password, user.password)) {
```
- **Purpose**: Check user exists and password matches
- **Blog Example**: Verifies blog author credentials

**Line 5**: `return res.status(400).json({ message: 'Invalid login credentials' })`
- **Purpose**: Return error for invalid credentials
- **Blog Example**: Returns error for wrong email/password

**Line 6**: `const token = await user.generateAuthToken()`
- **Purpose**: Generate authentication token
- **Blog Example**: Creates JWT token for blog author

**Line 7**: `res.json({ user, token })`
- **Purpose**: Return user data and token
- **Blog Example**: Returns blog author info and token

**Lines 8-10**: Error handling
```javascript
} catch (error) {
  res.status(400).json({ message: error.message })
}
```
- **Purpose**: Handle authentication errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **API Routes**: User authentication endpoints
- **Placement**: Direct API endpoint, no middleware needed

#### **Blog Application Example**
```javascript
// Login blog author via API
router.post('/api/authors/login', blogApiController.loginAuthor)
```

---

### **4. `exports.updateUser` - API User Update**

#### **Full Function**
```javascript
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
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.updateUser = async (req, res) => {`
- **Purpose**: Export API user update function
- **Blog Example**: Updates blog author via API

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches update errors

**Line 3**: `const updates = Object.keys(req.body)`
- **Purpose**: Get fields to update
- **Blog Example**: Identifies which blog author fields to change

**Line 4**: `const user = await User.findOne({ _id: req.params.id })`
- **Purpose**: Find user by ID
- **Blog Example**: Finds blog author by ID

**Lines 5-7**: User existence check
```javascript
if (!user) {
  return res.status(404).json({ message: 'User not found' })
}
```
- **Purpose**: Ensure user exists
- **Blog Example**: Confirms blog author exists

**Line 8**: `updates.forEach(update => user[update] = req.body[update])`
- **Purpose**: Update each field
- **Blog Example**: Updates blog author name, bio, etc.

**Line 9**: `await user.save()`
- **Purpose**: Save changes
- **Blog Example**: Persists blog author changes

**Line 10**: `res.json(user)`
- **Purpose**: Return updated user
- **Blog Example**: Returns updated blog author

**Lines 11-13**: Error handling
```javascript
} catch (error) {
  res.status(400).json({ message: error.message })
}
```
- **Purpose**: Handle update errors
- **Blog Example**: Returns error for invalid data

#### **When to Use**
- **API Routes**: User profile updates
- **Placement**: After authentication middleware

#### **Blog Application Example**
```javascript
// Update blog author via API
router.put('/api/authors/:id', blogApiController.auth, blogApiController.updateAuthor)
```

---

### **5. `exports.deleteUser` - API User Deletion**

#### **Full Function**
```javascript
exports.deleteUser = async (req, res) => {
  try {
    await req.user.deleteOne()
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.deleteUser = async (req, res) => {`
- **Purpose**: Export API user deletion function
- **Blog Example**: Deletes blog author via API

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches deletion errors

**Line 3**: `await req.user.deleteOne()`
- **Purpose**: Delete user from database
- **Blog Example**: Removes blog author and all their posts

**Line 4**: `res.json({ message: 'User deleted successfully' })`
- **Purpose**: Return success message
- **Blog Example**: Confirms blog author deletion

**Lines 5-7**: Error handling
```javascript
} catch (error) {
  res.status(400).json({ message: error.message })
}
```
- **Purpose**: Handle deletion errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **API Routes**: User account deletion
- **Placement**: After authentication middleware

#### **Blog Application Example**
```javascript
// Delete blog author via API
router.delete('/api/authors/:id', blogApiController.auth, blogApiController.deleteAuthor)
```

---

### **6. `exports.getProfile` - API User Profile**

#### **Full Function**
```javascript
exports.getProfile = async (req, res) => {
  try {
    await req.user.populate('fruits')
    res.json({ user: req.user })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
```

#### **Line-by-Line Explanation**

**Line 1**: `exports.getProfile = async (req, res) => {`
- **Purpose**: Export API profile function
- **Blog Example**: Gets blog author profile via API

**Line 2**: `try {`
- **Purpose**: Start error handling
- **Blog Example**: Catches profile retrieval errors

**Line 3**: `await req.user.populate('fruits')`
- **Purpose**: Populate user's related data
- **Blog Example**: Gets blog author with all their posts

**Line 4**: `res.json({ user: req.user })`
- **Purpose**: Return user data
- **Blog Example**: Returns blog author with posts

**Lines 5-7**: Error handling
```javascript
} catch (error) {
  res.status(400).json({ message: error.message })
}
```
- **Purpose**: Handle profile errors
- **Blog Example**: Returns error for database issues

#### **When to Use**
- **API Routes**: User profile retrieval
- **Placement**: After authentication middleware

#### **Blog Application Example**
```javascript
// Get blog author profile via API
router.get('/api/authors/profile', blogApiController.auth, blogApiController.getProfile)
```

---

## 🍎 Fruit API Controller (`controllers/fruits/apiController.js`)

### **1. `apiController.index` - API List Items**

#### **Full Function**
```javascript
index(req, res) {
  res.json(res.locals.data.fruits)
}
```

#### **Line-by-Line Explanation**

**Line 1**: `index(req, res) {`
- **Purpose**: Export index function for API
- **Blog Example**: Lists all blog posts via API

**Line 2**: `res.json(res.locals.data.fruits)`
- **Purpose**: Return JSON array of items
- **Blog Example**: Returns JSON array of blog posts

#### **When to Use**
- **API Routes**: List all items for authenticated user
- **Placement**: After data controller, before response

#### **Blog Application Example**
```javascript
// List all blog posts via API
router.get('/api/posts', blogApiController.auth, blogDataController.index, blogApiController.index)
```

---

### **2. `apiController.show` - API Single Item**

#### **Full Function**
```javascript
show(req, res) {
  res.json(res.locals.data.fruit)
}
```

#### **Line-by-Line Explanation**

**Line 1**: `show(req, res) {`
- **Purpose**: Export show function for API
- **Blog Example**: Gets single blog post via API

**Line 2**: `res.json(res.locals.data.fruit)`
- **Purpose**: Return JSON object of item
- **Blog Example**: Returns JSON object of blog post

#### **When to Use**
- **API Routes**: Get single item details
- **Placement**: After data controller, before response

#### **Blog Application Example**
```javascript
// Get single blog post via API
router.get('/api/posts/:id', blogApiController.auth, blogDataController.show, blogApiController.show)
```

---

### **3. `apiController.create` - API Create Item**

#### **Full Function**
```javascript
create(req, res) {
  res.status(201).json(res.locals.data.fruit)
}
```

#### **Line-by-Line Explanation**

**Line 1**: `create(req, res) {`
- **Purpose**: Export create function for API
- **Blog Example**: Creates blog post via API

**Line 2**: `res.status(201).json(res.locals.data.fruit)`
- **Purpose**: Return created item with 201 status
- **Blog Example**: Returns created blog post with 201 status

#### **When to Use**
- **API Routes**: Create new item
- **Placement**: After data controller, before response

#### **Blog Application Example**
```javascript
// Create blog post via API
router.post('/api/posts', blogApiController.auth, blogDataController.create, blogApiController.create)
```

---

### **4. `apiController.destroy` - API Delete Item**

#### **Full Function**
```javascript
destroy(req, res) {
  res.status(200).json({ message: 'Fruit successfully deleted' })
}
```

#### **Line-by-Line Explanation**

**Line 1**: `destroy(req, res) {`
- **Purpose**: Export destroy function for API
- **Blog Example**: Deletes blog post via API

**Line 2**: `res.status(200).json({ message: 'Fruit successfully deleted' })`
- **Purpose**: Return success message
- **Blog Example**: Returns success message for deleted blog post

#### **When to Use**
- **API Routes**: Delete item
- **Placement**: After data controller, before response

#### **Blog Application Example**
```javascript
// Delete blog post via API
router.delete('/api/posts/:id', blogApiController.auth, blogDataController.destroy, blogApiController.destroy)
```

---

## 📊 Controller Usage Summary

### **Data Controllers (Web Routes)**
- **Purpose**: Handle data operations for web views
- **Authentication**: Check tokens from query params or headers
- **Response**: Store data in `res.locals.data` for view controllers
- **Blog Example**: Handle blog post CRUD operations for web interface

### **API Controllers (JSON Routes)**
- **Purpose**: Handle data operations for API responses
- **Authentication**: Check tokens from headers only
- **Response**: Return JSON directly
- **Blog Example**: Handle blog post CRUD operations for mobile apps

### **Key Differences**
1. **Authentication**: Data controllers support both query params and headers, API controllers use headers only
2. **Response Format**: Data controllers store data for views, API controllers return JSON
3. **Error Handling**: Data controllers use `next()`, API controllers return responses directly
4. **Usage**: Data controllers for web forms, API controllers for programmatic access

This comprehensive guide shows students exactly how each controller function works and how to adapt them for different applications like a blog system. 