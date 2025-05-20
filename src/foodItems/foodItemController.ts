import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import getConnection from "../config/db";
import createFoodTable from "./foodItemsTable";
import { FoodItem } from "./foodItemTypes";
import { RowDataPacket } from "mysql2";


const createFoodItem = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = parseInt(req.params.id);

    const { name, description } = req.body;
    if (!userId || !name || !description) {
        return next(createHttpError(400, "User ID and food name are required"));
    }

    try {
        const db = await getConnection();
        await createFoodTable();

        await db.query(
            "INSERT INTO food (user_id, name, description) VALUES (?, ?, ?)",
            [userId, name, description]
        );

        res.status(201).json({ message: "Food item added for user " + userId });
    } catch (error) {
        console.log(error);
        next(createHttpError(500, "Failed to add food item"));
    }
};

const updateFoodItem = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body;
  const { userId, foodId } = req.params;

  if (!name || !description || !userId || !foodId) {
    return next(createHttpError(400, "All fields are required: userId, foodId, name, description"));
  }

  try {
    const db = await getConnection();

    const [result] = await db.query(
      `UPDATE food 
       SET name = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [name, description, foodId, userId]
    );

    const updateResult = result as { affectedRows: number };
    console.log(updateResult);
    

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Food item not found or not owned by user" });
    }

    res.status(200).json({ message: "Food item updated successfully" });
  } catch (error) {
    console.error("Error updating food item:", error);
    return next(createHttpError(500, "Server error while updating food item"));
  }
};

const listFoods = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;

  try {
    const db = await getConnection();

    if (!userId) {
      return next(createHttpError(400, "User ID is required"));
    }

    const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
      "SELECT * FROM food WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No food items found for this user." });
    }

    res.status(200).json({
      message: `Food items for user ${userId}`,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching food items:", error);
    return next(createHttpError(500, "Server error while fetching food items"));
  }
};

const getingSingleList = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, foodId } = req.params;

  if (!userId || !foodId) {
    return next(createHttpError(400, "User ID and Food ID are required"));
  }

  try {
    const db = await getConnection();

    const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
      `SELECT * FROM food WHERE user_id = ? AND id = ?`,
      [userId, foodId]
    );

    if (rows.length === 0) {
      return next(createHttpError(404, "No food item found for the given user and food ID"));
    }

    res.status(200).json({
      message: `Food item with ID ${foodId} for user ${userId}`,
      data: rows[0],
    });

  } catch (error) {
    console.error("Error while fetching food item:", error);
    return next(createHttpError(500, "Error while fetching food item"));
  }
};

export { createFoodItem, updateFoodItem ,listFoods , getingSingleList };
