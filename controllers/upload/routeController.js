const express = require('express')
const router = express.Router()
const { index } = require('./viewController')

// GET /upload - Show upload form
router.get('/', index)

module.exports = router 