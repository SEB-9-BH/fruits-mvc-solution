const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const userRoutes = require('./controllers/auth/routeController')
const fruitsRouter = require('./controllers/fruits/routeController')
const apiRoutes = require('./routes/apiRoutes')
const app = express()

app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())

app.use(express.json()) // this is new this for the api
app.use(express.urlencoded({ extended: true })) // req.body
app.use(methodOverride('_method')) // <====== add method override
app.use((req, res, next) => {
    res.locals.data = {}
    next()
})
app.use(express.static('public'))
app.use(morgan('dev'))

// Web routes (for views)
app.use('/users', userRoutes)
app.use('/fruits', fruitsRouter)

// API routes (for JSON responses)
app.use('/api', apiRoutes)

module.exports = app