require('dotenv').config()

module.exports = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
  },
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fruits',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret'
} 