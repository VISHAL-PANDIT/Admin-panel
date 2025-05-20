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

export { createFoodItem };
