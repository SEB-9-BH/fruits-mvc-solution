const cloudinary = require('cloudinary').v2
const fs = require('fs')
const config = require('../config')

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
})

// Upload image to Cloudinary
const uploadImage = (path) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(path, (error, result) => {
      if (error) {
        console.error('Upload error:', error)
        return reject(error)
      }
      console.log('Upload result:', result)
      return resolve(result)
    })
  })
}

// Upload video to Cloudinary
const uploadVideo = (path) => {
  const options = { resource_type: 'video' }
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(path, options, (error, result) => {
      if (error) {
        console.error('Video upload error:', error)
        return reject(error)
      }
      console.log('Video upload result:', result)
      return resolve(result)
    })
  })
}

// Handle image upload service
const uploadImageService = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ msg: 'No file uploaded' })
    }

    const file = req.files.file
    const fileName = `${Date.now()}_${file.name}`
    const path = `${__dirname}/../public/uploads/${fileName}`

    // Ensure uploads directory exists
    const uploadsDir = `${__dirname}/../public/uploads`
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Move file to temporary location
    await file.mv(path)

    // Upload to Cloudinary
    const result = await uploadImage(path)

    // Clean up temporary file
    fs.unlink(path, (err) => {
      if (err) console.error('Error deleting temp file:', err)
    })

    res.json({
      success: true,
      data: result,
      url: result.secure_url,
      public_id: result.public_id
    })

  } catch (error) {
    console.error('Upload service error:', error)
    res.status(500).json({ 
      success: false, 
      msg: 'Upload failed', 
      error: error.message 
    })
  }
}

// Handle video upload service
const uploadVideoService = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ msg: 'No file uploaded' })
    }

    const file = req.files.file
    const fileName = `${Date.now()}_${file.name}`
    const path = `${__dirname}/../public/uploads/${fileName}`

    // Ensure uploads directory exists
    const uploadsDir = `${__dirname}/../public/uploads`
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Move file to temporary location
    await file.mv(path)

    // Upload to Cloudinary
    const result = await uploadVideo(path)

    // Clean up temporary file
    fs.unlink(path, (err) => {
      if (err) console.error('Error deleting temp file:', err)
    })

    res.json({
      success: true,
      data: result,
      url: result.secure_url,
      public_id: result.public_id
    })

  } catch (error) {
    console.error('Video upload service error:', error)
    res.status(500).json({ 
      success: false, 
      msg: 'Video upload failed', 
      error: error.message 
    })
  }
}

module.exports = {
  uploadImage,
  uploadVideo,
  uploadImageService,
  uploadVideoService
} 