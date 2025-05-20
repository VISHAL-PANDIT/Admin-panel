import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import getConnection from "../config/db";
import createFoodTable from "./foodItemsTable";


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

export { createFoodItem, updateFoodItem };
