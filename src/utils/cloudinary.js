import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',  // auto detects file type (image, video, etc.)
        });

       // console.log('File uploaded successfully', response.url);
       fs.unlinkSync(localFilePath);  // Clean up the local file after upload
        // Return the URL of the uploaded file  
        return response;
        
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error.message);
        fs.unlinkSync(localFilePath);  // Clean up the local file
        return null;
    }
};

export { uploadOnCloudinary };
