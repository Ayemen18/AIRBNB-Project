// Cloudinary configuration for image uploads
const cloudinary = require('cloudinary').v2; // Cloudinary SDK v2
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Multer storage for Cloudinary

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name : process.env.CLOUD_NAME, // Your Cloudinary cloud name
    api_key : process.env.CLOUD_API_KEY, // Your Cloudinary API key
    api_secret : process.env.CLOUD_API_SECRET // Your Cloudinary API secret
});

// Configure multer storage to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Cloudinary instance
  params: {
    folder: 'wanderlust_DEV', // Folder name in Cloudinary where images will be stored
    allowedFormats: ["png","jpg","jpeg"], // Only allow these image formats
  },
});

// Export cloudinary instance and storage for use in routes
module.exports = {
    cloudinary,
    storage
};