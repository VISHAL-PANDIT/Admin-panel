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
     frontendDomain : process.env.FRONTEND_DOMAIN

}

export const config =Object.freeze( _config);