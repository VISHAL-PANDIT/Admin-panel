import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create food-items directory inside uploads
const foodItemsDir = path.join(uploadsDir, 'food-items');
if (!fs.existsSync(foodItemsDir)) {
    fs.mkdirSync(foodItemsDir, { recursive: true });
}

// Function to clean up old files
const cleanupOldFiles = async (directory: string) => {
    try {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            
            // Delete files older than 1 hour
            const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
            if (stats.mtime.getTime() < oneHourAgo) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old file: ${filePath}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
};

// Function to upload file to Cloudinary
const uploadToCloudinary = async (filePath: string, folder: string = 'food-items') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        // Delete the local file after successful upload
        fs.unlinkSync(filePath);
        console.log(`Deleted local file after upload: ${filePath}`);

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        // Delete the local file even if upload fails
        fs.unlinkSync(filePath);
        throw error;
    }
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId: string) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted file from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

// Function to get temporary file path
const getTempFilePath = (originalname: string) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${originalname}`;
    return path.join(foodItemsDir, filename);
};

export {
    uploadToCloudinary,
    deleteFromCloudinary,
    cleanupOldFiles,
    getTempFilePath,
    foodItemsDir
}; 