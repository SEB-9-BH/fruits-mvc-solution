# Debug Guide for Instructors: Complete Error Analysis & Best Practices

## 🚨 **Debugging Philosophy**

**Start from the connection points and work inward.** The most common errors occur at the boundaries between files, modules, and systems. Always debug in this order:

1. **File Connections** (imports, requires, exports)
2. **Route Connections** (mounted routes, middleware order)
3. **Data Flow** (request → middleware → controller → model → response)
4. **Template Connections** (JSX syntax, template literals)
5. **Database Connections** (MongoDB, Mongoose)

---

## 📋 **Error Categories & Codes**

### **1. Module Resolution Errors (E_MODULE_NOT_FOUND)**

#### **Common Causes:**
- **File not found**: `Cannot find module './controllers/fruits/dataController'`
- **Wrong file extension**: `Cannot find module './models/user'` (missing .js)
- **Case sensitivity**: `Cannot find module './Models/User'` (should be `./models/user`)
- **Path typos**: `Cannot find module './controlers/fruits'` (should be `controllers`)

#### **Debug Steps:**
```bash
# Check if file exists
ls controllers/fruits/dataController.js

# Check case sensitivity
find . -name "dataController.js" -type f

# Verify require path
node -e "console.log(require.resolve('./controllers/fruits/dataController.js'))"
```

### **2. Export/Import Errors (E_INVALID_EXPORT)**

#### **Common Causes:**
- **Missing exports**: `TypeError: Cannot read property 'index' of undefined`
- **Wrong export syntax**: `module.exports = { index }` vs `exports.index = index`
- **Default vs named exports**: `import dataController from './dataController'` vs `const { dataController } = require('./dataController')`

#### **Debug Steps:**
```javascript
// Check what's being exported
console.log(module.exports);

// Check if function exists
console.log(typeof dataController.index);
```

### **3. Route Mounting Errors (E_ROUTE_NOT_FOUND)**

#### **Common Causes:**
- **Routes not mounted**: `Cannot GET /fruits` (route not added to app.js)
- **Wrong mount path**: `app.use('/fruit', fruitsRouter)` vs `app.use('/fruits', fruitsRouter)`
- **Middleware order**: Auth middleware before route mounting
- **Missing route file**: `Cannot find module './routes/fruits'`

#### **Debug Steps:**
```javascript
// Check mounted routes
console.log(app._router.stack);

// Check route registration
app._router.stack.forEach(layer => {
  if (layer.route) {
    console.log(layer.route.path);
  }
});
```

### **4. Express Middleware Errors (E_MIDDLEWARE_ERROR)**

#### **Common Causes:**
- **Missing body-parser**: `req.body is undefined`
- **Wrong middleware order**: `app.use(express.json())` after routes
- **Missing method-override**: PUT/DELETE requests not working
- **Morgan not configured**: No request logging

#### **Debug Steps:**
```javascript
// Check middleware order
console.log('Body parser:', typeof req.body);
console.log('Method override:', req.method);

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request body:', req.body);
  console.log('Request method:', req.method);
  next();
});
```

### **5. Authentication Errors (E_AUTH_FAILED)**

#### **Common Causes:**
- **Missing token**: `No token provided`
- **Invalid token format**: `jwt malformed`
- **Wrong secret**: `invalid signature`
- **Token expired**: `jwt expired`
- **User not found**: `User not found in database`

#### **Debug Steps:**
```javascript
// Check token presence
console.log('Query token:', req.query.token);
console.log('Header token:', req.header('Authorization'));

// Verify JWT manually
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, 'secret');
  console.log('Decoded token:', decoded);
} catch (error) {
  console.log('JWT error:', error.message);
}
```

### **6. Database Connection Errors (E_DB_CONNECTION)**

#### **Common Causes:**
- **MongoDB not running**: `ECONNREFUSED`
- **Wrong connection string**: `Invalid connection string`
- **Network issues**: `ENOTFOUND`
- **Authentication failed**: `Authentication failed`

#### **Debug Steps:**
```javascript
// Check MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB error:', err);
});
```

### **7. Model/Schema Errors (E_MODEL_ERROR)**

#### **Common Causes:**
- **Schema not defined**: `Schema hasn't been registered for model "User"`
- **Wrong model name**: `Model "user" not found` vs `Model "User" not found`
- **Missing required fields**: `Path `email` is required`
- **Invalid data types**: `Cast to ObjectId failed`

#### **Debug Steps:**
```javascript
// Check model registration
console.log('Available models:', mongoose.modelNames());

// Check schema fields
console.log('User schema:', User.schema.obj);
```

### **8. Template/JSX Errors (E_TEMPLATE_ERROR)**

#### **Common Causes:**
- **JSX syntax errors**: `Unexpected token <`
- **Missing closing tags**: `Expected corresponding JSX closing tag`
- **Template literal errors**: `Unexpected template literal expression`
- **Missing props**: `Cannot read property 'name' of undefined`

#### **Debug Steps:**
```javascript
// Check JSX compilation
console.log('Props received:', props);
console.log('Data available:', res.locals.data);

// Validate template literals
console.log('Template string:', `Hello ${props.name}`);
```

---

## 🔍 **50+ Things That Could Go Wrong**

### **File & Module Issues (1-15)**

1. **Filename misspelled**: `dataController.js` vs `dataContoller.js`
2. **Wrong file extension**: `.jsx` vs `.js` for non-React files
3. **Case sensitivity**: `User.js` vs `user.js`
4. **Missing file**: Controller file doesn't exist
5. **Wrong directory structure**: Files in wrong folders
6. **Circular dependencies**: File A requires B, B requires A
7. **Missing exports**: Function not exported from module
8. **Wrong export syntax**: `module.exports` vs `exports`
9. **Default vs named exports**: `export default` vs `export const`
10. **Import/require mismatch**: ES6 imports vs CommonJS requires
11. **Missing package.json dependencies**: Package not installed
12. **Wrong package version**: Incompatible package versions
13. **Node modules corrupted**: `npm install` needed
14. **File permissions**: Read/write access issues
15. **Hidden characters**: Invisible characters in filenames

### **Route & Middleware Issues (16-30)**

16. **Route not mounted**: Route file not added to app.js
17. **Wrong mount path**: `/fruit` vs `/fruits`
18. **Middleware order wrong**: Auth before body-parser
19. **Missing middleware**: `express.json()` not added
20. **Route conflicts**: Same path, different methods
21. **Missing method-override**: PUT/DELETE not working
22. **Wrong HTTP method**: POST vs PUT vs PATCH
23. **Route parameters wrong**: `:id` vs `:fruitId`
24. **Query parameters missing**: Token not passed in URL
25. **Headers not set**: Authorization header missing
26. **CORS issues**: Cross-origin requests blocked
27. **Static files not served**: CSS/JS not loading
28. **Morgan not configured**: No request logging
29. **Error handling missing**: Unhandled promise rejections
30. **Route file not found**: Missing route controller

### **Authentication & Security Issues (31-40)**

31. **JWT secret wrong**: Different secrets in different files
32. **Token format wrong**: `Bearer ` prefix missing
33. **Token expired**: JWT past expiration time
34. **User not found**: User deleted from database
35. **Password not hashed**: Plain text passwords
36. **bcrypt not working**: Password comparison fails
37. **Missing auth middleware**: Routes not protected
38. **Wrong token source**: Query vs header confusion
39. **Token not passed**: Links missing `?token=xyz`
40. **Multiple tokens**: Conflicting tokens in request

### **Database & Model Issues (41-50)**

41. **MongoDB not running**: Database service stopped
42. **Wrong connection string**: Invalid MongoDB URI
43. **Database not found**: Wrong database name
44. **Collection not found**: Wrong collection name
45. **Schema validation failed**: Required fields missing
46. **Data type mismatch**: String vs Number vs ObjectId
47. **Reference errors**: Foreign key relationships broken
48. **Index issues**: Duplicate unique fields
49. **Connection timeout**: Network issues
50. **Memory issues**: MongoDB memory server problems

### **Template & Frontend Issues (51-65)**

51. **JSX syntax errors**: Unclosed tags, wrong attributes
52. **Template literal spaces**: Extra spaces in `${variable}`
53. **Props undefined**: Data not passed to component
54. **Missing closing tags**: `</div>` missing
55. **Wrong attribute names**: `className` vs `class`
56. **Event handlers wrong**: `onClick` vs `onclick`
57. **Form action wrong**: Wrong URL in form action
58. **Method override missing**: `_method` field not added
59. **CSRF tokens**: Missing CSRF protection
60. **CSS not loading**: Wrong path to stylesheet
61. **Images not loading**: Wrong path to images
62. **JavaScript errors**: Client-side JS issues
63. **Browser compatibility**: Different browser behavior
64. **Responsive design**: Mobile layout issues
65. **Accessibility**: Screen reader compatibility

---

## 🛠️ **Debugging Best Practices**

### **1. Start with File Connections**

```bash
# Check all file paths
find . -name "*.js" -o -name "*.jsx" | grep -v node_modules

# Verify requires work
node -e "console.log(require('./controllers/fruits/dataController.js'))"

# Check exports
node -e "const dc = require('./controllers/fruits/dataController.js'); console.log(Object.keys(dc))"
```

### **2. Verify Route Mounting**

```javascript
// Add to app.js for debugging
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Mounted routes:', app._router.stack.filter(layer => layer.route).map(layer => layer.route.path));
  next();
});
```

### **3. Check Middleware Order**

```javascript
// Verify middleware is loaded
console.log('Body parser loaded:', typeof req.body !== 'undefined');
console.log('Method override loaded:', req.method);
console.log('Morgan loaded:', typeof morgan === 'function');
```

### **4. Debug Authentication**

```javascript
// Add to auth middleware
console.log('Token from query:', req.query.token);
console.log('Token from header:', req.header('Authorization'));
console.log('User found:', !!req.user);
```

### **5. Validate Database**

```javascript
// Check MongoDB connection
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', (err) => console.log('❌ MongoDB error:', err));

// Check models
console.log('Available models:', mongoose.modelNames());
```

### **6. Test Templates**

```javascript
// Add to view controllers
console.log('Data passed to view:', res.locals.data);
console.log('Props available:', props);
```

---

## 🚨 **Common Error Messages & Solutions**

### **"Cannot find module"**
- **Solution**: Check file path, case sensitivity, file extension
- **Debug**: `ls -la controllers/fruits/`

### **"Cannot read property 'index' of undefined"**
- **Solution**: Check exports in controller file
- **Debug**: `console.log(module.exports)`

### **"Cannot GET /fruits"**
- **Solution**: Check route mounting in app.js
- **Debug**: `console.log(app._router.stack)`

### **"req.body is undefined"**
- **Solution**: Add `app.use(express.json())` before routes
- **Debug**: Check middleware order

### **"No token provided"**
- **Solution**: Check token in URL or headers
- **Debug**: `console.log(req.query.token, req.header('Authorization'))`

### **"jwt malformed"**
- **Solution**: Check token format and secret
- **Debug**: Verify JWT manually

### **"ECONNREFUSED"**
- **Solution**: Start MongoDB service
- **Debug**: `brew services start mongodb-community`

### **"Schema hasn't been registered"**
- **Solution**: Check model definition and registration
- **Debug**: `console.log(mongoose.modelNames())`

---

## 📋 **Debugging Checklist**

### **Before Starting Debug:**
- [ ] MongoDB is running
- [ ] All dependencies installed (`npm install`)
- [ ] No syntax errors in any files
- [ ] All files saved
- [ ] Server restarted after changes

### **File Connection Check:**
- [ ] All require paths correct
- [ ] All files exist
- [ ] Case sensitivity correct
- [ ] File extensions correct
- [ ] Exports properly defined

### **Route Check:**
- [ ] Routes mounted in app.js
- [ ] Correct mount paths
- [ ] Middleware order correct
- [ ] HTTP methods correct
- [ ] Route parameters correct

### **Authentication Check:**
- [ ] JWT secret consistent
- [ ] Token format correct
- [ ] User exists in database
- [ ] Auth middleware applied
- [ ] Token passed correctly

### **Database Check:**
- [ ] MongoDB connected
- [ ] Models registered
- [ ] Schema validation passes
- [ ] Data types correct
- [ ] References valid

### **Template Check:**
- [ ] JSX syntax correct
- [ ] Props passed correctly
- [ ] Template literals valid
- [ ] Closing tags present
- [ ] CSS/JS loading

---

## 🎯 **Instructor Tips**

### **For Students:**
1. **Always start with the error message** - it usually points to the problem
2. **Check the file mentioned in the error** - that's where the issue is
3. **Use console.log() liberally** - see what data is actually there
4. **Restart the server** after making changes
5. **Check the browser console** for frontend errors

### **For Debugging Sessions:**
1. **Have students read the error aloud** - often they spot the issue
2. **Ask "What should be there?"** - compare expected vs actual
3. **Use the debugging checklist** - systematic approach
4. **Check one thing at a time** - don't change multiple things
5. **Verify each step** - don't assume anything works

### **Common Student Mistakes:**
- **Copy-paste errors** - extra spaces, wrong quotes
- **Case sensitivity** - JavaScript is case-sensitive
- **Missing semicolons** - especially in JSX
- **Wrong file paths** - relative vs absolute paths
- **Forgetting to restart** - changes don't take effect until restart

This debug guide covers the most common issues and provides a systematic approach to troubleshooting any problem in the application. 