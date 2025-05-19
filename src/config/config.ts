import { config as confi } from "dotenv";
confi();

const _config = {
     port : process.env.PORT,
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME

}

export const config =Object.freeze( _config);