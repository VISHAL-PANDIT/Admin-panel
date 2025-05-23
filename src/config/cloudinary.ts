import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from './config';
import { foodItemsDir, cleanupOldFiles } from '../utils/fileHandler';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret
});

interface CloudinaryParams {
  folder: string;
  allowed_formats: string[];
  transformation: Array<{
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    fetch_format?: string;
  }>;
}

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'food-items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  } as CloudinaryParams
});

// Error handling middleware for multer
const handleMulterError = (err: Error | multer.MulterError, req: Request, res: Response) => {
  console.error('Multer error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`
    });
  }
  return res.status(500).json({
    error: 'Something went wrong with the file upload',
    details: err.message
  });
};

// Create multer upload instance with error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!') as unknown as null, false);
    }
    cb(null, true);
  }
}).single('image');

// Wrapper function to handle multer errors
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('Starting file upload middleware');
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return handleMulterError(err, req, res);
    }
    console.log('File upload successful:', req.file);
    next();
  });
};

// Clean up old files periodically
setInterval(() => {
  cleanupOldFiles(foodItemsDir);
}, 60 * 60 * 1000); // Run every hour

export { cloudinary, upload, uploadMiddleware }; 