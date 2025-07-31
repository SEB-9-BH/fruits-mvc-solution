# Route Architecture & Application Flow

This document provides a comprehensive breakdown of all routes in the application, how the application connects and runs, and the user stories that drive the functionality.

---

## 🏗️ Application Architecture Overview

### **Entry Points**
- **`server.js`** - Application entry point and server startup
- **`app.js`** - Express application configuration and middleware setup
- **Route Controllers** - Handle web routes (views) and API routes (JSON)

### **Architecture Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  server.js  │───▶│   app.js    │───▶│  Routes     │───▶│ Controllers │
│             │    │             │    │             │    │             │
│ • Entry     │    │ • Express   │    │ • Web       │    │ • Data      │
│ • Database  │    │ • Middleware│    │ • API       │    │ • Views     │
│ • Server    │    │ • Static    │    │ • Auth      │    │ • API       │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🚀 Application Startup Flow

### **1. server.js - Application Entry Point**

#### **Purpose**
- Application entry point and server startup
- Database connection management
- Environment configuration

#### **Functions**
1. **`require('dotenv').config()`** - Load environment variables
2. **`require('./app')`** - Import Express application
3. **`require('./models/db')`** - Import database connection
4. **Database Event Listeners**
   - `db.once('open')` - Log successful connection
   - `db.on('error')` - Handle database errors
5. **`app.listen(PORT)`** - Start HTTP server

#### **Data Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Environment │───▶│  Database   │───▶│   Express   │───▶│ HTTP Server │
│ Variables   │    │ Connection  │    │ Application │    │ (Port 3000) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **2. app.js - Express Application Configuration**

#### **Purpose**
- Configure Express application
- Set up middleware
- Mount routes
- Handle static files

#### **Middleware Stack**
1. **`express.json()`** - Parse JSON request bodies (for API)
2. **`express.urlencoded()`** - Parse form data
3. **`methodOverride('_method')`** - Handle PUT/DELETE from forms
4. **`res.locals.data`** - Global data for views
5. **`express.static('public')`** - Serve static files (CSS, images)
6. **`morgan('dev')`** - HTTP request logging

#### **Route Mounting**
- **Web Routes**: `/users` and `/fruits` (for views)
- **API Routes**: `/api` (for JSON responses)

#### **Configuration**
- **View Engine**: JSX for React-like components
- **Template Engine**: `jsx-view-engine`

---

## 🌐 Web Routes (Views)

### **User Routes (`/users`)**

#### **1. GET /users - Show Sign Up Form**
- **Route**: `router.get('/', viewController.signUp)`
- **Purpose**: Display user registration form
- **Controller**: `viewController.signUp`
- **View**: `views/auth/SignUp.jsx`
- **User Story**: "As a new user, I want to see a registration form so I can create an account"

#### **2. POST /users - Create User Account**
- **Route**: `router.post('/', dataController.createUser, viewController.redirectToLogin)`
- **Purpose**: Process user registration and redirect to login
- **Controllers**: 
  - `dataController.createUser` - Create user in database
  - `viewController.redirectToLogin` - Redirect to login page
- **User Story**: "As a new user, I want to register so I can access the application"

#### **3. GET /users/login - Show Login Form**
- **Route**: `router.get('/login', viewController.signIn)`
- **Purpose**: Display user login form
- **Controller**: `viewController.signIn`
- **View**: `views/auth/SignIn.jsx`
- **User Story**: "As a registered user, I want to see a login form so I can access my account"

#### **4. POST /users/login - Authenticate User**
- **Route**: `router.post('/login', dataController.loginUser, fruitsViewController.redirectHome)`
- **Purpose**: Process login and redirect to fruits home
- **Controllers**:
  - `dataController.loginUser` - Authenticate user
  - `fruitsViewController.redirectHome` - Redirect to fruits page
- **User Story**: "As a user, I want to login so I can access my fruit collection"

#### **5. PUT /users/:id - Update User Profile**
- **Route**: `router.put('/:id', dataController.updateUser)`
- **Purpose**: Update user information
- **Controller**: `dataController.updateUser`
- **User Story**: "As a user, I want to update my profile so I can keep my information current"

#### **6. DELETE /users/:id - Delete User Account**
- **Route**: `router.delete('/:id', dataController.auth, dataController.deleteUser)`
- **Purpose**: Remove user account (requires authentication)
- **Controllers**:
  - `dataController.auth` - Verify authentication
  - `dataController.deleteUser` - Delete user from database
- **User Story**: "As a user, I want to delete my account so I can remove my data"

### **Fruit Routes (`/fruits`)**

#### **1. GET /fruits - Show User's Fruit Collection**
- **Route**: `router.get('/', authDataController.auth, dataController.index, viewController.index)`
- **Purpose**: Display authenticated user's fruit collection
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.index` - Get user's fruits
  - `viewController.index` - Display fruits page
- **View**: `views/fruits/Index.jsx`
- **User Story**: "As a logged-in user, I want to see my fruit collection so I can manage my fruits"

#### **2. GET /fruits/new - Show Create Fruit Form**
- **Route**: `router.get('/new', authDataController.auth, viewController.newView)`
- **Purpose**: Display form to create new fruit
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `viewController.newView` - Show create form
- **View**: `views/fruits/New.jsx`
- **User Story**: "As a user, I want to see a form to add a new fruit to my collection"

#### **3. POST /fruits - Create New Fruit**
- **Route**: `router.post('/', authDataController.auth, dataController.create, viewController.redirectHome)`
- **Purpose**: Process fruit creation and redirect to fruits list
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.create` - Create fruit in database
  - `viewController.redirectHome` - Redirect to fruits list
- **User Story**: "As a user, I want to add a new fruit to my collection so I can track my fruits"

#### **4. GET /fruits/:id - Show Single Fruit**
- **Route**: `router.get('/:id', authDataController.auth, dataController.show, viewController.show)`
- **Purpose**: Display detailed information about specific fruit
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.show` - Get fruit by ID
  - `viewController.show` - Display fruit details
- **View**: `views/fruits/Show.jsx`
- **User Story**: "As a user, I want to view a specific fruit so I can see its details"

#### **5. GET /fruits/:id/edit - Show Edit Fruit Form**
- **Route**: `router.get('/:id/edit', authDataController.auth, dataController.show, viewController.edit)`
- **Purpose**: Display form to edit existing fruit
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.show` - Get fruit by ID
  - `viewController.edit` - Show edit form
- **View**: `views/fruits/Edit.jsx`
- **User Story**: "As a user, I want to edit a fruit so I can update its information"

#### **6. PUT /fruits/:id - Update Fruit**
- **Route**: `router.put('/:id', authDataController.auth, dataController.update, viewController.redirectShow)`
- **Purpose**: Process fruit update and redirect to fruit details
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.update` - Update fruit in database
  - `viewController.redirectShow` - Redirect to fruit details
- **User Story**: "As a user, I want to update a fruit so I can keep its information current"

#### **7. DELETE /fruits/:id - Delete Fruit**
- **Route**: `router.delete('/:id', authDataController.auth, dataController.destroy, viewController.redirectHome)`
- **Purpose**: Remove fruit from collection and redirect to fruits list
- **Controllers**:
  - `authDataController.auth` - Verify authentication
  - `dataController.destroy` - Delete fruit from database
  - `viewController.redirectHome` - Redirect to fruits list
- **User Story**: "As a user, I want to delete a fruit from my collection so I can manage my data"

---

## 🔌 API Routes (`/api`)

### **User API Routes**

#### **1. POST /api/users - Create User (API)**
- **Route**: `router.post('/users', userApiController.createUser)`
- **Purpose**: Create new user account via API
- **Controller**: `userApiController.createUser`
- **Response**: JSON with user data and JWT token
- **User Story**: "As a developer, I want to create users via API so I can integrate with other systems"

#### **2. POST /api/users/login - Login User (API)**
- **Route**: `router.post('/users/login', userApiController.loginUser)`
- **Purpose**: Authenticate user via API
- **Controller**: `userApiController.loginUser`
- **Response**: JSON with user data and JWT token
- **User Story**: "As a developer, I want to authenticate users via API so I can build mobile apps"

#### **3. GET /api/users/profile - Get User Profile (API)**
- **Route**: `router.get('/users/profile', userApiController.auth, userApiController.getProfile)`
- **Purpose**: Retrieve authenticated user's profile via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `userApiController.getProfile` - Return user data
- **Response**: JSON with user profile and associated fruits
- **User Story**: "As a developer, I want to get user profiles via API so I can display user information"

#### **4. PUT /api/users/:id - Update User (API)**
- **Route**: `router.put('/users/:id', userApiController.auth, userApiController.updateUser)`
- **Purpose**: Update user information via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `userApiController.updateUser` - Update user data
- **Response**: JSON with updated user data
- **User Story**: "As a developer, I want to update user profiles via API so I can sync user data"

#### **5. DELETE /api/users/:id - Delete User (API)**
- **Route**: `router.delete('/users/:id', userApiController.auth, userApiController.deleteUser)`
- **Purpose**: Delete user account via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `userApiController.deleteUser` - Remove user from database
- **Response**: JSON success message
- **User Story**: "As a developer, I want to delete users via API so I can manage user accounts"

### **Fruit API Routes**

#### **1. GET /api/fruits - List All Fruits (API)**
- **Route**: `router.get('/fruits', userApiController.auth, fruitDataController.index, fruitApiController.index)`
- **Purpose**: Retrieve all fruits for authenticated user via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `fruitDataController.index` - Get user's fruits
  - `fruitApiController.index` - Return JSON array
- **Response**: JSON array of user's fruits
- **User Story**: "As a developer, I want to get user's fruits via API so I can display them in mobile apps"

#### **2. GET /api/fruits/:id - Get Single Fruit (API)**
- **Route**: `router.get('/fruits/:id', userApiController.auth, fruitDataController.show, fruitApiController.show)`
- **Purpose**: Retrieve specific fruit by ID via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `fruitDataController.show` - Get fruit by ID
  - `fruitApiController.show` - Return JSON object
- **Response**: JSON object with fruit details
- **User Story**: "As a developer, I want to get specific fruit details via API so I can show detailed information"

#### **3. POST /api/fruits - Create Fruit (API)**
- **Route**: `router.post('/fruits', userApiController.auth, fruitDataController.create, fruitApiController.create)`
- **Purpose**: Create new fruit via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `fruitDataController.create` - Create fruit in database
  - `fruitApiController.create` - Return created fruit
- **Response**: JSON with created fruit data
- **User Story**: "As a developer, I want to create fruits via API so I can add fruits from mobile apps"

#### **4. PUT /api/fruits/:id - Update Fruit (API)**
- **Route**: `router.put('/fruits/:id', userApiController.auth, fruitDataController.update, fruitApiController.show)`
- **Purpose**: Update existing fruit via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `fruitDataController.update` - Update fruit in database
  - `fruitApiController.show` - Return updated fruit
- **Response**: JSON with updated fruit data
- **User Story**: "As a developer, I want to update fruits via API so I can edit fruits from mobile apps"

#### **5. DELETE /api/fruits/:id - Delete Fruit (API)**
- **Route**: `router.delete('/fruits/:id', userApiController.auth, fruitDataController.destroy, fruitApiController.destroy)`
- **Purpose**: Delete fruit via API
- **Controllers**:
  - `userApiController.auth` - Verify authentication
  - `fruitDataController.destroy` - Delete fruit from database
  - `fruitApiController.destroy` - Return success message
- **Response**: JSON success message
- **User Story**: "As a developer, I want to delete fruits via API so I can remove fruits from mobile apps"

---

## 🔄 Application Flow & Data Movement

### **Web Application Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │───▶│   Express   │───▶│ Controllers │───▶│   Views     │
│             │    │   Server    │    │             │    │             │
│ • HTTP      │    │ • Routes    │    │ • Data      │    │ • JSX       │
│ • Requests  │    │ • Middleware│    │ • Logic     │    │ • HTML      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **API Application Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Express   │───▶│ Controllers │───▶│   JSON      │
│             │    │   Server    │    │             │    │ Response    │
│ • HTTP      │    │ • API Routes│    │ • Data      │    │ • JSON      │
│ • JSON      │    │ • Auth      │    │ • Logic     │    │ • Data      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **Authentication Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Request   │───▶│ Auth Middle │───▶│ Controller  │───▶│ Response    │
│             │    │             │    │             │    │             │
│ • Token     │    │ • Verify    │    │ • Process   │    │ • Data      │
│ • Headers   │    │ • JWT       │    │ • Logic     │    │ • Status    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 👥 User Stories & Application Purpose

### **Primary User Stories**

#### **1. User Registration & Authentication**
- **Story**: "As a new user, I want to create an account so I can access the fruit tracking application"
- **Routes**: `POST /users`, `GET /users`, `POST /users/login`, `GET /users/login`
- **Features**: Registration form, login form, password hashing, JWT tokens

#### **2. Fruit Collection Management**
- **Story**: "As a logged-in user, I want to manage my fruit collection so I can track what fruits I have"
- **Routes**: `GET /fruits`, `POST /fruits`, `GET /fruits/new`
- **Features**: View all fruits, add new fruits, form validation

#### **3. Individual Fruit Management**
- **Story**: "As a user, I want to view and edit individual fruits so I can keep my information accurate"
- **Routes**: `GET /fruits/:id`, `GET /fruits/:id/edit`, `PUT /fruits/:id`, `DELETE /fruits/:id`
- **Features**: Fruit details, edit forms, update/delete operations

#### **4. Profile Management**
- **Story**: "As a user, I want to update my profile so I can keep my information current"
- **Routes**: `PUT /users/:id`, `DELETE /users/:id`
- **Features**: Profile updates, account deletion

### **API User Stories**

#### **5. Mobile Application Support**
- **Story**: "As a developer, I want to access user and fruit data via API so I can build mobile applications"
- **Routes**: All `/api/*` routes
- **Features**: JSON responses, authentication via headers, CRUD operations

#### **6. Third-Party Integration**
- **Story**: "As a developer, I want to integrate with external systems so I can sync data across platforms"
- **Routes**: `POST /api/users`, `POST /api/users/login`, `GET /api/users/profile`
- **Features**: User management API, authentication tokens

### **Application Purpose**

#### **Core Functionality**
- **Personal Fruit Tracking**: Users can maintain a personal collection of fruits
- **User Authentication**: Secure login and registration system
- **Data Management**: Full CRUD operations for fruits
- **API Access**: RESTful API for external applications

#### **Technical Features**
- **MVC Architecture**: Clean separation of concerns
- **JWT Authentication**: Secure token-based authentication
- **Dual Interface**: Web views and API endpoints
- **Database Integration**: MongoDB with Mongoose ODM
- **Testing**: Comprehensive test suite for all functionality

#### **User Experience**
- **Web Interface**: User-friendly forms and views
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Clear error messages and validation
- **Navigation**: Intuitive flow between pages

---

## 📊 Route Summary

### **Web Routes (Views)**
| Method | Route | Purpose | Authentication |
|--------|-------|---------|----------------|
| GET | `/users` | Show signup form | No |
| POST | `/users` | Create user account | No |
| GET | `/users/login` | Show login form | No |
| POST | `/users/login` | Authenticate user | No |
| PUT | `/users/:id` | Update user profile | Yes |
| DELETE | `/users/:id` | Delete user account | Yes |
| GET | `/fruits` | Show fruit collection | Yes |
| GET | `/fruits/new` | Show create form | Yes |
| POST | `/fruits` | Create new fruit | Yes |
| GET | `/fruits/:id` | Show fruit details | Yes |
| GET | `/fruits/:id/edit` | Show edit form | Yes |
| PUT | `/fruits/:id` | Update fruit | Yes |
| DELETE | `/fruits/:id` | Delete fruit | Yes |

### **API Routes (JSON)**
| Method | Route | Purpose | Authentication |
|--------|-------|---------|----------------|
| POST | `/api/users` | Create user (API) | No |
| POST | `/api/users/login` | Login user (API) | No |
| GET | `/api/users/profile` | Get user profile (API) | Yes |
| PUT | `/api/users/:id` | Update user (API) | Yes |
| DELETE | `/api/users/:id` | Delete user (API) | Yes |
| GET | `/api/fruits` | List fruits (API) | Yes |
| GET | `/api/fruits/:id` | Get fruit (API) | Yes |
| POST | `/api/fruits` | Create fruit (API) | Yes |
| PUT | `/api/fruits/:id` | Update fruit (API) | Yes |
| DELETE | `/api/fruits/:id` | Delete fruit (API) | Yes |

### **Total Routes: 24**
- **Web Routes**: 13 routes for user interface
- **API Routes**: 11 routes for programmatic access
- **Authentication**: 17 routes require authentication
- **Public Routes**: 7 routes are publicly accessible

This comprehensive route architecture supports both web-based user interactions and API-based programmatic access, providing flexibility for different types of applications and integrations. 