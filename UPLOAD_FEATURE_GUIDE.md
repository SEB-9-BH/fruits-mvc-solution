# Upload Feature Implementation Guide

This guide explains how to implement image and video upload functionality using Cloudinary and express-fileupload in your Express.js application.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Implementation Steps](#implementation-steps)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

## Overview

The upload feature allows users to upload images and videos to Cloudinary, a cloud-based media management service. The implementation includes:

- **express-fileupload**: Middleware for handling file uploads
- **Cloudinary**: Cloud storage for images and videos
- **File validation**: Size limits and type checking
- **Automatic cleanup**: Temporary files are deleted after upload
- **Error handling**: Comprehensive error responses

## Prerequisites

- Node.js and npm installed
- Cloudinary account (free tier available)
- Express.js application

## Installation

### 1. Install Dependencies

```bash
npm install cloudinary express-fileupload
```

### 2. Create Required Directories

```bash
mkdir -p public/uploads
mkdir -p services
mkdir -p routes
mkdir -p controllers/upload
mkdir -p views/upload
```

## Configuration

### 1. Environment Variables

Create a `.env` file in your project root:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Other environment variables
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret
```

### 2. Configuration File

Create `config.js` in your project root:

```javascript
require('dotenv').config()

module.exports = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
  },
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret'
}
```

## Implementation Steps

### Step 1: Create Upload Service

Create `services/uploadService.js`:

```javascript
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
```

### Step 2: Create Upload Routes

Create `routes/uploadRoutes.js`:

```javascript
const express = require('express')
const router = express.Router()
const { uploadImageService, uploadVideoService } = require('../services/uploadService')

// Upload image route
router.post('/image', uploadImageService)

// Upload video route
router.post('/video', uploadVideoService)

module.exports = router
```

### Step 3: Update App.js

Add the following to your `app.js`:

```javascript
const fileUpload = require('express-fileupload')

// Add this after your other middleware
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  abortOnLimit: true
}))

// Add upload routes
const uploadRoutes = require('./routes/uploadRoutes')
app.use('/upload', uploadRoutes)
```

### Step 4: Create Upload Form (Optional)

Create `views/upload/UploadForm.jsx`:

```javascript
const React = require('react')

const UploadForm = () => {
  const handleImageUpload = async (e) => {
    e.preventDefault()
    
    const formData = new FormData()
    const fileInput = document.getElementById('imageFile')
    formData.append('file', fileInput.files[0])

    try {
      const response = await fetch('/upload/image', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Upload successful! Image URL: ${result.url}`)
        console.log('Upload result:', result)
      } else {
        alert('Upload failed: ' + result.msg)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    
    const formData = new FormData()
    const fileInput = document.getElementById('videoFile')
    formData.append('file', fileInput.files[0])

    try {
      const response = await fetch('/upload/video', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Video upload successful! Video URL: ${result.url}`)
        console.log('Video upload result:', result)
      } else {
        alert('Video upload failed: ' + result.msg)
      }
    } catch (error) {
      console.error('Video upload error:', error)
      alert('Video upload failed')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>File Upload Test</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Upload Image</h2>
        <form onSubmit={handleImageUpload}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="file" 
              id="imageFile" 
              accept="image/*" 
              required 
              style={{ marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            Upload Image
          </button>
        </form>
      </div>

      <div>
        <h2>Upload Video</h2>
        <form onSubmit={handleVideoUpload}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="file" 
              id="videoFile" 
              accept="video/*" 
              required 
              style={{ marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Upload Video
          </button>
        </form>
      </div>
    </div>
  )
}

module.exports = UploadForm
```

### Step 5: Update .gitignore

Add the following to your `.gitignore`:

```
public/uploads/
```

## Usage Examples

### Frontend Form Example

```html
<form enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*" required>
  <button type="submit">Upload Image</button>
</form>
```

### JavaScript Upload Example

```javascript
// Upload image
const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/upload/image', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Image URL:', result.url)
      return result.url
    } else {
      throw new Error(result.msg)
    }
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}

// Upload video
const uploadVideo = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/upload/video', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Video URL:', result.url)
      return result.url
    } else {
      throw new Error(result.msg)
    }
  } catch (error) {
    console.error('Video upload failed:', error)
    throw error
  }
}

// Usage
const fileInput = document.getElementById('fileInput')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (file) {
    try {
      const url = await uploadImage(file)
      console.log('Uploaded to:', url)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }
})
```

### Integration with Database Models

```javascript
// Example: Adding image URL to a fruit model
const Fruit = require('../models/fruit')

const createFruitWithImage = async (req, res) => {
  try {
    // Upload image first
    const formData = new FormData()
    formData.append('file', req.files.file)
    
    const uploadResponse = await fetch('/upload/image', {
      method: 'POST',
      body: formData
    })
    
    const uploadResult = await uploadResponse.json()
    
    if (!uploadResult.success) {
      return res.status(400).json({ msg: 'Image upload failed' })
    }
    
    // Create fruit with image URL
    const fruit = new Fruit({
      name: req.body.name,
      color: req.body.color,
      imageUrl: uploadResult.url,
      publicId: uploadResult.public_id
    })
    
    await fruit.save()
    res.json({ success: true, fruit })
    
  } catch (error) {
    res.status(500).json({ msg: 'Error creating fruit', error: error.message })
  }
}
```

## API Reference

### Endpoints

#### POST /upload/image
Upload an image to Cloudinary.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (image file)

**Response:**
```json
{
  "success": true,
  "data": {
    "public_id": "cloudinary_public_id",
    "secure_url": "https://res.cloudinary.com/...",
    "url": "http://res.cloudinary.com/...",
    "width": 1920,
    "height": 1080,
    "format": "jpg"
  },
  "url": "https://res.cloudinary.com/...",
  "public_id": "cloudinary_public_id"
}
```

#### POST /upload/video
Upload a video to Cloudinary.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (video file)

**Response:**
```json
{
  "success": true,
  "data": {
    "public_id": "cloudinary_public_id",
    "secure_url": "https://res.cloudinary.com/...",
    "url": "http://res.cloudinary.com/...",
    "width": 1920,
    "height": 1080,
    "format": "mp4",
    "duration": 30.5
  },
  "url": "https://res.cloudinary.com/...",
  "public_id": "cloudinary_public_id"
}
```

### Error Responses

```json
{
  "success": false,
  "msg": "No file uploaded",
  "error": "Error message"
}
```

## Configuration Options

### File Upload Limits

```javascript
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Max files per request
  },
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached",
  uploadTimeout: 60000, // 60 seconds
  useTempFiles: true,
  tempFileDir: "/tmp/"
}))
```

### Cloudinary Configuration Options

```javascript
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret',
  secure: true // Use HTTPS
})
```

## Troubleshooting

### Common Issues

1. **"No file uploaded" error**
   - Check that the form has `enctype="multipart/form-data"`
   - Ensure the file input name is `file`
   - Verify the file is actually selected

2. **File size limit exceeded**
   - Increase the `fileSize` limit in the middleware configuration
   - Check Cloudinary's upload limits (100MB for free tier)

3. **Cloudinary configuration errors**
   - Verify your Cloudinary credentials in the `.env` file
   - Check that your Cloudinary account is active
   - Ensure you're using the correct cloud name

4. **Temporary file cleanup issues**
   - Check that the `public/uploads` directory exists and is writable
   - Verify file permissions on the uploads directory

### Debug Mode

Enable debug logging by adding this to your upload service:

```javascript
// Add this to uploadImageService and uploadVideoService
console.log('File received:', req.files.file)
console.log('File size:', req.files.file.size)
console.log('File type:', req.files.file.mimetype)
```

### Testing

Test your upload functionality with:

```bash
# Test image upload
curl -X POST -F "file=@/path/to/image.jpg" http://localhost:3000/upload/image

# Test video upload
curl -X POST -F "file=@/path/to/video.mp4" http://localhost:3000/upload/video
```

## Security Considerations

1. **File Type Validation**: Always validate file types on both client and server
2. **File Size Limits**: Set appropriate file size limits
3. **Secure URLs**: Use Cloudinary's secure URLs in production
4. **Environment Variables**: Never commit API keys to version control
5. **HTTPS**: Use HTTPS in production for secure file uploads

## Performance Tips

1. **Image Optimization**: Use Cloudinary's transformation parameters
2. **Progressive Upload**: Implement chunked uploads for large files
3. **Caching**: Cache uploaded file URLs when appropriate
4. **CDN**: Cloudinary automatically serves files through their CDN

## Additional Features

### Image Transformations

```javascript
// Add transformations to your upload
const result = await cloudinary.uploader.upload(path, {
  transformation: [
    { width: 800, height: 600, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
})
```

### Video Transformations

```javascript
// Add video transformations
const result = await cloudinary.uploader.upload(path, {
  resource_type: 'video',
  transformation: [
    { width: 1280, height: 720, crop: 'scale' },
    { quality: 'auto' }
  ]
})
```

This implementation provides a robust, scalable upload system that can handle both images and videos with proper error handling and security measures. 