import { config as confi } from "dotenv";
confi();

const _config = {
     port : process.env.PORT,
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     env: process.env.NODE_ENV,
     jwtSecret: process.env.JWT_SECRET,
     frontendDomain : process.env.FRONTEND_DOMAIN,
     cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
     cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
     cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET
}

export const config =Object.freeze( _config);