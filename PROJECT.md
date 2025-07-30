# Unit 2 Project: Full-Stack MVC Application

## 🎯 Project Overview

For your Unit 2 project, you will create a full-stack web application using Express.js, MongoDB, and the MVC (Model-View-Controller) architecture pattern. Your application must include authentication, multiple models with relationships, comprehensive styling, and testing.

---

## 📋 Project Requirements

### **Core Requirements (Must Have)**

| Requirement | Description | Points |
|-------------|-------------|--------|
| **2+ Models** | At least 2 Mongoose models with proper relationships | 25 |
| **Full MVC Architecture** | Proper separation of Models, Views, and Controllers | 20 |
| **Authentication System** | JWT-based authentication with protected routes | 20 |
| **Unit Testing** | At least 1 test suite covering 1 model | 15 |
| **Styling** | Beautiful, responsive CSS with custom design | 10 |
| **Valid Project Idea** | Creative, well-thought-out application concept | 10 |

### **Bonus Features (Extra Credit)**

| Feature | Description | Points |
|---------|-------------|--------|
| **API Endpoints** | RESTful API with JSON responses | +10 |
| **Load Testing** | Artillery configuration and performance testing | +5 |
| **Advanced Features** | File uploads, search, filtering, etc. | +5 |
| **Deployment** | Live application on Heroku/Railway/etc. | +5 |

---

## 🏗️ Technical Requirements

### **Backend Requirements**
- ✅ Express.js server with proper routing
- ✅ MongoDB with Mongoose ODM
- ✅ JWT authentication system
- ✅ MVC architecture implementation
- ✅ Error handling and validation
- ✅ Environment variables (.env)

### **Frontend Requirements**
- ✅ JSX view templates
- ✅ Responsive CSS styling
- ✅ Form handling and validation
- ✅ User-friendly interface
- ✅ Navigation and user flow

### **Testing Requirements**
- ✅ Jest test suite
- ✅ MongoDB Memory Server for testing
- ✅ At least 1 model test suite
- ✅ API endpoint testing (bonus)

### **Code Quality**
- ✅ Clean, readable code
- ✅ Proper file organization
- ✅ Comments and documentation
- ✅ Git repository with commits

---

## 💡 Project Ideas & Examples

### **1. Blog Application** 📝

**Concept**: A personal or multi-author blog with articles, comments, and user management.

**Models**:
- **User** (author, admin, reader)
- **Post** (title, content, author, tags)
- **Comment** (content, author, post)

**Features**:
- User registration and authentication
- Create, edit, delete blog posts
- Comment system
- Tag/category system
- Author profiles

**Architecture Diagram**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │    Post     │    │   Comment   │
│             │    │             │    │             │
│ • name      │◄───│ • title     │◄───│ • content   │
│ • email     │    │ • content   │    │ • author    │
│ • password  │    │ • author    │    │ • post      │
│ • role      │    │ • tags      │    │ • date      │
│ • posts[]   │    │ • comments[]│    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

### **2. Inventory Management System** 📦

**Concept**: Track products, stock levels, suppliers, and orders for a business.

**Models**:
- **Product** (name, description, price, stock)
- **Supplier** (name, contact, products)
- **Order** (items, total, status, date)

**Features**:
- Product catalog with images
- Stock level tracking
- Order management
- Supplier information
- Low stock alerts

**Architecture Diagram**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supplier   │    │   Product   │    │    Order    │
│             │    │             │    │             │
│ • name      │◄───│ • name      │◄───│ • items[]   │
│ • contact   │    │ • price     │    │ • total     │
│ • email     │    │ • stock     │    │ • status    │
│ • products[]│    │ • supplier  │    │ • date      │
│             │    │ • orders[]  │    │ • customer  │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

### **3. Curriculum Guide for Degree Program** 🎓

**Concept**: Manage courses, prerequisites, and degree requirements for an academic program.

**Models**:
- **Course** (name, credits, description, prerequisites)
- **Program** (name, requirements, total credits)
- **Student** (name, enrolled courses, progress)

**Features**:
- Course catalog with prerequisites
- Degree requirement tracking
- Student progress monitoring
- Course scheduling
- GPA calculation

**Architecture Diagram**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Course    │    │   Program   │    │   Student   │
│             │    │             │    │             │
│ • name      │◄───│ • name      │◄───│ • name      │
│ • credits   │    │ • courses[] │    │ • email     │
│ • prereqs[] │    │ • credits   │    │ • courses[] │
│ • program   │    │ • students[]│    │ • gpa       │
│ • students[]│    │             │    │ • program   │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

### **4. Student/Teacher/Worker Database** 👥

**Concept**: Manage students, teachers, and administrative staff for an educational institution.

**Models**:
- **Person** (name, email, role, department)
- **Course** (name, teacher, students, schedule)
- **Department** (name, head, members)

**Features**:
- Role-based access control
- Course enrollment system
- Department management
- Contact information
- Schedule management

**Architecture Diagram**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Person    │    │   Course    │    │ Department  │
│             │    │             │    │             │
│ • name      │◄───│ • name      │◄───│ • name      │
│ • email     │    │ • teacher   │    │ • head      │
│ • role      │    │ • students[]│    │ • members[] │
│ • dept      │    │ • schedule  │    │ • courses[] │
│ • courses[] │    │ • dept      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🎨 Additional Project Ideas

### **Creative Applications**
- **Recipe Manager**: Recipes, ingredients, meal planning
- **Fitness Tracker**: Workouts, exercises, progress tracking
- **Event Planner**: Events, attendees, venues, schedules
- **Library System**: Books, authors, members, loans
- **Restaurant Menu**: Dishes, categories, orders, reviews
- **Pet Adoption**: Pets, shelters, adopters, applications
- **Task Manager**: Projects, tasks, team members, deadlines
- **Real Estate**: Properties, agents, clients, viewings

---

## 📊 Grading Rubric

### **PASS** ✅
- ✅ All core requirements met (100 points minimum)
- ✅ Clean, well-organized code
- ✅ Comprehensive testing
- ✅ Beautiful, responsive design
- ✅ Bonus features implemented (optional)
- ✅ Excellent documentation

**Minimum Requirements for PASS:**
- 2+ Models with proper relationships
- Full MVC Architecture implementation
- JWT Authentication system working
- At least 1 unit test suite
- Responsive CSS styling
- Valid, creative project idea
- Application runs without errors
- All tests pass successfully

### **FAIL** ❌
- ❌ Missing core requirements
- ❌ Poor code organization
- ❌ No testing implemented
- ❌ Minimal or no styling
- ❌ Major functionality issues
- ❌ Application doesn't run
- ❌ Tests don't pass
- ❌ No documentation

---

## 🚀 Project Submission

### **Required Files**
```
project-name/
├── README.md              # Project documentation
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── server.js              # Server entry point
├── app.js                 # Express app configuration
├── models/                # Mongoose models
├── controllers/           # MVC controllers
├── views/                 # JSX templates
├── public/                # Static files (CSS, images)
├── routes/                # Route definitions
├── tests/                 # Test files
└── .gitignore            # Git ignore file
```

### **README.md Requirements**
- Project description and features
- Installation instructions
- API documentation (if applicable)
- Screenshots or demo links
- Technologies used
- Future improvements

### **Submission Checklist**
- [ ] All code committed to Git repository
- [ ] README.md with complete documentation
- [ ] Application runs without errors
- [ ] Tests pass successfully
- [ ] Styling is complete and responsive
- [ ] Authentication system working
- [ ] Models have proper relationships
- [ ] MVC architecture implemented

---

## 💡 Tips for Success

### **Planning Phase**
1. **Choose a clear, focused project idea**
2. **Design your database schema first**
3. **Plan your user stories and features**
4. **Create wireframes for your views**
5. **Set up your project structure early**

### **Development Phase**
1. **Start with models and database setup**
2. **Implement authentication early**
3. **Build basic CRUD operations**
4. **Add styling and polish**
5. **Write tests as you develop**
6. **Commit frequently to Git**

### **Testing Phase**
1. **Test all user flows**
2. **Verify authentication works**
3. **Check responsive design**
4. **Run your test suite**
5. **Deploy and test live**

### **Common Pitfalls to Avoid**
- ❌ Overcomplicating your project idea
- ❌ Not planning your database relationships
- ❌ Skipping authentication implementation
- ❌ Leaving styling until the end
- ❌ Not writing tests
- ❌ Poor Git commit practices

---

## 🎉 Success Criteria

Your project will be considered successful if:

1. **Functional**: All features work as intended
2. **Authenticated**: Users can register, login, and access protected content
3. **Relational**: Models have proper relationships and data integrity
4. **Styled**: Application looks professional and is responsive
5. **Tested**: Core functionality is covered by tests
6. **Documented**: Clear README and code comments
7. **Deployed**: Application is live and accessible (bonus)

---

## 📞 Getting Help

- **Office Hours**: Attend instructor office hours
- **Peer Review**: Work with classmates for feedback
- **Documentation**: Read Express.js and Mongoose docs
- **Stack Overflow**: Search for specific technical issues
- **GitHub**: Look at similar projects for inspiration

---

**Good luck with your Unit 2 project! Remember to have fun and be creative with your application idea! 🚀** 