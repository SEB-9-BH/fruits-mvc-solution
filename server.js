require('dotenv').config()
const express = require('express')
const app = express()
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override') //<====== import method-override
const fruitsRouter = require('./controllers/routeController')
const db = require('./models/db')
const PORT = process.env.PORT || 3000

// app.set('views', __dirname + '/views')
app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())


db.once('open', () => {
    console.log('connected to mongo')
})
db.on('error', (error) => {
  console.error(error.message)
})



// middleware to give us the body of the request data the user filled out
app.use(express.urlencoded({ extended: true })) // req.body
app.use(methodOverride('_method')) // <====== add method override
app.use(express.static('public'))

app.use((req, res, next) => {
    res.locals.data = {}
    next()
})

app.get('/', (req, res) => {
    res.send('Hello World')
})
// inject the router into the code
app.use('/fruits', fruitsRouter)

app.listen(PORT, () => {
    console.log('app running on port 3000 you are so good at coding...')
})