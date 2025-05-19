import { NextFunction, Request, Response } from "express"
import createHttpError from "http-errors";
import bcrypt from 'bcrypt'
import getConnection from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import createTable from "./userTable";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";



const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  const tableName = "User"; 

  if (!name || !email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  try {
    await createTable(tableName); 

    const db = await getConnection();

    // Check for existing email
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM \`${tableName}\` WHERE email = ?`,
      [email]
    );

    if (rows.length > 0) {
      return next(createHttpError(400, `${tableName} already exists with this email`));
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO \`${tableName}\` (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashPassword]
    );

    const token = sign({sub: result.insertId} , config.jwtSecret as string , {expiresIn: '7d'});
    
    return res.status(201).json({ 
    message: `${tableName} created successfully` ,
    accessToken: token
    });


    
  } catch (error) {
    console.log(error);
    
    return next(createHttpError(500, "Error while creating user"));
  }
};
// const loginUser = (req: Request , res: Response , next: NextFunction) =>{
    
// }

export {createUser}