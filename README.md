# Fruits API - MVC Architecture with JWT Authentication

## Overview

This project demonstrates a complete RESTful API built with Express.js and MongoDB, following the Model-View-Controller (MVC) architecture pattern. The application includes both web views and API endpoints, with JWT authentication supporting both query parameters (for web views) and headers (for API calls).

---

## 🏗️ MVC Architecture

### What is MVC?

MVC (Model-View-Controller) is a software design pattern that separates an application into three interconnected components:

- **Model**: Manages data, business logic, and rules
- **View**: Displays data and handles user interface
- **Controller**: Processes user input and coordinates between Model and View

### Our MVC Implementation

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     ROUTES      │    │   CONTROLLERS   │    │     MODELS      │
│                 │    │                 │    │                 │
│ • /fruits       │───▶│ • dataController│───▶│ • Fruit         │
│ • /users        │    │ • viewController│    │ • User          │
│ • /api/*        │    │ • apiController │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │      VIEWS      │
                       │                 │
                       │ • JSX Templates │
                       │ • JSON Responses│
                       └─────────────────┘
```

### File Structure

```
fruits/
├── app.js                 # Express app configuration
├── server.js              # Server entry point
├── models/
│   ├── user.js           # User model with JWT methods
│   ├── fruit.js          # Fruit model
│   └── db.js             # Database connection
├── controllers/
│   ├── auth/
│   │   ├── dataController.js    # User business logic
│   │   ├── viewController.js    # User view logic
│   │   ├── apiController.js     # User API responses
│   │   └── routeController.js   # User routes
│   └── fruits/
│       ├── dataController.js    # Fruit business logic
│       ├── viewController.js    # Fruit view logic
│       ├── apiController.js     # Fruit API responses
│       └── routeController.js   # Fruit routes
├── routes/
│   └── apiRoutes.js      # API router for /api endpoints
├── views/
│   └── auth/             # JSX view templates
│   └── fruits/           # JSX view templates
│   └── layouts/          # JSX view templates
├── tests/                # Jest test files
└── public/               # Static files
```

---

## 🔐 JWT Authentication System

### Dual Authentication Support

Our application supports JWT authentication in two ways:

1. **Query Parameters** (for web views): `?token=xyz`
2. **Headers** (for API calls): `Authorization: Bearer xyz`

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Routes    │     │   Auth      │     │   Database  │
│             │     │             │     │  Middleware │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │ 1. Request with   │                   │                   │
       │    token          │                   │                   │
       │─-────────────────▶│                   │                   │
       │                   │ 2. Pass to auth   │                   │
       │                   │    middleware     │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │ 3. Verify token   │
       │                   │                   │    & find user    │
       │                   │                   │──────────────────▶│
       │                   │                   │ 4. Return user    │
       │                   │                   │◀──────────────────│
       │                   │ 5. Add user to    │                   │
       │                   │    req.user       │                   │
       │                   │◀──────────────────│                   │
       │ 6. Continue to    │                   │                   │
       │    controller     │                   │                   │
       │◀──────────────────│                   │                   │
```

### Token Generation

```javascript
// In User model
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id }, 'secret')
  return token
}
```

### Authentication Middleware

```javascript
exports.auth = async (req, res, next) => {
  try {
    let token
    if(req.query.token){
      token = req.query.token  // For web views
    }else if(req.header('Authorization')){
      token = req.header('Authorization').replace('Bearer ', '')  // For API
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

---

## 🚀 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users` | Create new user | No |
| POST | `/api/users/login` | Login user | No |
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/:id` | Update user | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes |

### Fruit Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/fruits` | Get all fruits | Yes |
| GET | `/api/fruits/:id` | Get single fruit | Yes |
| POST | `/api/fruits` | Create fruit | Yes |
| PUT | `/api/fruits/:id` | Update fruit | Yes |
| DELETE | `/api/fruits/:id` | Delete fruit | Yes |

### Web Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/fruits` | Show all fruits | Yes |
| GET | `/fruits/new` | New fruit form | Yes |
| POST | `/fruits` | Create fruit | Yes |
| GET | `/fruits/:id` | Show single fruit | Yes |
| GET | `/fruits/:id/edit` | Edit fruit form | Yes |
| PUT | `/fruits/:id` | Update fruit | Yes |
| DELETE | `/fruits/:id` | Delete fruit | Yes |

---

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Load Testing with Artillery

```bash
npm run load
```

### Test Structure

```
tests/
├── user.test.js          # User API tests
├── fruit.test.js         # Fruit API tests
└── integration.test.js   # Integration tests
```

---

## 📊 Data Flow Diagrams

### Web Request Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Express   │    │ Controller  │    │   MongoDB   │
│             │    │   Router    │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. GET /fruits    │                   │                   │
       │    ?token=xyz     │                   │                   │
       │─────────────────▶│                   │                   │
       │                   │ 2. Route to       │                   │
       │                   │    fruitsRouter   │                   │
       │                   │─────────────────▶│                   │
       │                   │                   │ 3. Auth middleware│
       │                   │                   │    verify token   │
       │                   │                   │─────────────────▶│
       │                   │                   │ 4. Return user   │
       │                   │                   │◀─────────────────│
       │                   │ 5. dataController │                   │
       │                   │    get fruits     │                   │
       │                   │─────────────────▶│                   │
       │                   │                   │ 6. Query fruits  │
       │                   │                   │    from DB       │
       │                   │                   │─────────────────▶│
       │                   │                   │ 7. Return fruits │
       │                   │                   │◀─────────────────│
       │                   │ 8. viewController │                   │
       │                   │    render view    │                   │
       │                   │◀─────────────────│                   │
       │ 9. HTML response  │                   │                   │
       │◀─────────────────│                   │                   │
```

### API Request Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │    │   Express   │    │ Controller  │    │   MongoDB   │
│  Client     │    │   Router    │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. GET /api/fruits│                   │                   │
       │    Authorization: │                   │                   │
       │    Bearer xyz     │                   │                   │
       │─────────────────▶│                   │                   │
       │                   │ 2. Route to       │                   │
       │                   │    apiRoutes      │                   │
       │                   │─────────────────▶│                   │
       │                   │                   │ 3. Auth middleware│
       │                   │                   │    verify header  │
       │                   │                   │─────────────────▶│
       │                   │                   │ 4. Return user   │
       │                   │                   │◀─────────────────│
       │                   │ 5. dataController │                   │
       │                   │    get fruits     │                   │
       │                   │─────────────────▶│                   │
       │                   │                   │ 6. Query fruits  │
       │                   │                   │    from DB       │
       │                   │                   │─────────────────▶│
       │                   │                   │ 7. Return fruits │
       │                   │                   │◀─────────────────│
       │                   │ 8. apiController  │                   │
       │                   │    JSON response  │                   │
       │                   │◀─────────────────│                   │
       │ 9. JSON response  │                   │                   │
       │◀─────────────────│                   │                   │
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <YOUR-FORKED-repository-url>
cd fruits

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start the development server
npm run dev

# Run tests
npm test

# Run load tests
npm run load
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fruits
JWT_SECRET=your-secret-key
```

---

## 📚 Learning Objectives

### Terminal Objectives:
1. ✅ Understand MVC architecture and its implementation in Express
2. ✅ Implement JWT authentication with dual support (query params & headers)
3. ✅ Create RESTful APIs with proper HTTP status codes
4. ✅ Separate concerns into Models, Views, and Controllers
5. ✅ Implement proper error handling and validation
6. ✅ Write comprehensive tests with Jest and Supertest
7. ✅ Perform load testing with Artillery
8. ✅ Use Morgan for HTTP request logging
9. ✅ Follow RESTful conventions for API design
10. ✅ Implement proper authentication and authorization

### Key Concepts Covered:

- **MVC Pattern**: Clear separation of concerns
- **JWT Authentication**: Secure token-based authentication
- **RESTful APIs**: Standard HTTP methods and status codes
- **Middleware**: Request processing pipeline
- **Testing**: Unit, integration, and load testing
- **Error Handling**: Proper error responses
- **Database Design**: MongoDB with Mongoose ODM

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run load tests
npm run load

# Check code coverage
npm run test:coverage
```

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
