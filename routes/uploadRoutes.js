const express = require('express')
const router = express.Router()
const { uploadImageService, uploadVideoService } = require('../services/uploadService')

// Upload image route
router.post('/image', uploadImageService)

// Upload video route
router.post('/video', uploadVideoService)

module.exports = router 