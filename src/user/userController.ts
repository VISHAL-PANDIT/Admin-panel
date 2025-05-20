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


 const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const tableName = "User";

  if (!email || !password) {
    return next(createHttpError(400, "Email and password are required"));
  }

  try {
    const db = await getConnection();

    // Fetch the user from DB
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM \`${tableName}\` WHERE email = ?`,
      [email]
    );
    

    if (rows.length === 0) {
      return next(createHttpError(400, "Invalid email or password"));
    }

    const user = rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(400, "Invalid email or password"));
    }

    // Create JWT token
    const token = sign(
      { sub: user.id, email: user.email },
      config.jwtSecret as string,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login successful",
      accessToken: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return next(createHttpError(500, "Internal server error"));
  }
};

export {createUser , loginUser}