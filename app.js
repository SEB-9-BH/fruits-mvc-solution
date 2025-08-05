const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const fileUpload = require('express-fileupload')
const userRoutes = require('./controllers/auth/routeController')
const fruitsRouter = require('./controllers/fruits/routeController')
const apiRoutes = require('./routes/apiRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const uploadViewRoutes = require('./controllers/upload/routeController')
const app = express()

app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())

app.use(express.json()) // this is new this for the api
app.use(express.urlencoded({ extended: true })) // req.body
app.use(methodOverride('_method')) // <====== add method override
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  abortOnLimit: true
}))
app.use((req, res, next) => {
    res.locals.data = {}
    next()
})
app.use(express.static('public'))
app.use(morgan('dev'))

// Web routes (for views)
app.use('/users', userRoutes)
app.use('/fruits', fruitsRouter)
app.use('/upload-form', uploadViewRoutes)

// API routes (for JSON responses)
app.use('/api', apiRoutes)

// Upload API routes
app.use('/upload', uploadRoutes)

module.exports = app