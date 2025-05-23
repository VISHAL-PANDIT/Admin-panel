import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import getConnection from "../config/db";
import createFoodTable from "./foodItemsTable";
import { FoodItem } from "./foodItemTypes";
import { RowDataPacket } from "mysql2";
import { cloudinary } from "../config/cloudinary";

// Extend Express Request type to include file property
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const createFoodItem = async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
) => {
    const userId = parseInt(req.params.userId);
    const { name, description, price } = req.body;
    const file = req.file;

    console.log('Create food item request:', {
        userId,
        name,
        description,
        price,
        file: file ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        } : null
    });

    if (!userId || !name || !description || !price) {
        return next(createHttpError(400, "User ID, food name, description, and price are required"));
    }

    try {
        // First verify if user exists and get their name
        const db = await getConnection();
        const [users] = await db.query<RowDataPacket[]>(
            "SELECT id, name FROM user WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return next(createHttpError(404, "User not found"));
        }

        const sellerName = users[0].name;
        await createFoodTable();

        // Upload image to Cloudinary if provided
        let imageUrl = null;
        let imagePublicId = null;
        
        if (file) {
            try {
                console.log('Uploading file to Cloudinary:', {
                    path: file.path,
                    originalname: file.originalname,
                    mimetype: file.mimetype
                });
                
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'food-items',
                    resource_type: 'auto'
                });
                
                console.log('Cloudinary upload successful:', {
                    url: result.secure_url,
                    public_id: result.public_id
                });
                
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', {
                    error: uploadError,
                    file: {
                        path: file.path,
                        originalname: file.originalname,
                        mimetype: file.mimetype
                    }
                });
                return next(createHttpError(500, "Failed to upload image to Cloudinary"));
            }
        }

        try {
            console.log('Attempting to insert food item:', {
                userId,
                sellerName,
                name,
                description,
                price,
                imageUrl,
                imagePublicId
            });

            const [result] = await db.query(
                "INSERT INTO food (user_id, seller_name, name, description, price, image_url, image_public_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [userId, sellerName, name, description, price, imageUrl, imagePublicId]
            );

            console.log('Database insert result:', result);

            if (!result || !('insertId' in result)) {
                throw new Error('Insert operation did not return expected result');
            }

            console.log('Database insert successful');
        } catch (dbError: unknown) {
            const error = dbError as { 
                code?: string;
                errno?: number;
                sqlMessage?: string;
                sqlState?: string;
                message?: string;
            };

            console.error('Database error details:', {
                code: error.code,
                errno: error.errno,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });

            // If we uploaded an image but database insert failed, delete the image
            if (imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(imagePublicId);
                } catch (deleteError) {
                    console.error('Failed to delete image after database error:', deleteError);
                }
            }

            // Handle specific database errors
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return next(createHttpError(400, "Invalid user ID - user does not exist"));
            }

            return next(createHttpError(500, "Failed to save food item to database: " + (error.message || 'Unknown error')));
        }

        res.status(201).json({ 
            message: "Food item added successfully",
            data: {
                name,
                description,
                price,
                sellerName,
                imageUrl
            }
        });
    } catch (error) {
        console.error('Unexpected error in createFoodItem:', error);
        next(createHttpError(500, "Failed to add food item"));
    }
};

const updateFoodItem = async (req: MulterRequest, res: Response, next: NextFunction) => {
    const { name, description, price } = req.body;
    const { userId, foodId } = req.params;
    const file = req.file;

    if (!name || !description || !price || !userId || !foodId) {
        return next(createHttpError(400, "All fields are required: userId, foodId, name, description, price"));
    }

    try {
        const db = await getConnection();

        // Get current food item to check for existing image
        const [currentItem] = await db.query<FoodItem[] & RowDataPacket[]>(
            "SELECT * FROM food WHERE id = ? AND user_id = ?",
            [foodId, userId]
        );

        if (currentItem.length === 0) {
            return res.status(404).json({ message: "Food item not found or not owned by user" });
        }

        let imageUrl = currentItem[0].image_url;
        let imagePublicId = currentItem[0].image_public_id;

        // If new image is uploaded, delete old one and upload new
        if (file) {
            // Delete old image from Cloudinary if exists
            if (imagePublicId) {
                await cloudinary.uploader.destroy(imagePublicId);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'food-items',
                resource_type: 'auto'
            });
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        }

        const [result] = await db.query(
            `UPDATE food 
             SET name = ?, description = ?, price = ?, image_url = ?, image_public_id = ?
             WHERE id = ? AND user_id = ?`,
            [name, description, price, imageUrl, imagePublicId, foodId, userId]
        );

        const updateResult = result as { affectedRows: number };

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: "Food item not found or not owned by user" });
        }

        res.status(200).json({ 
            message: "Food item updated successfully",
            data: {
                name,
                description,
                price,
                imageUrl
            }
        });
    } catch (error) {
        console.error("Error updating food item:", error);
        return next(createHttpError(500, "Server error while updating food item"));
    }
};

const listFoods = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

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

const deleteFoodItem = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, foodId } = req.params;

    if (!userId || !foodId) {
        return next(createHttpError(400, "User ID and Food ID are required"));
    }

    try {
        const db = await getConnection();

        // Get food item to check for image
        const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
            "SELECT * FROM food WHERE user_id = ? AND id = ?",
            [userId, foodId]
        );

        if (rows.length === 0) {
            return next(createHttpError(404, "Food item not found for the given user"));
        }

        // Delete image from Cloudinary if exists
        if (rows[0].image_public_id) {
            await cloudinary.uploader.destroy(rows[0].image_public_id);
        }

        await db.query("DELETE FROM food WHERE user_id = ? AND id = ?", [userId, foodId]);

        res.status(200).json({
            message: `Food item with ID ${foodId} deleted for user ${userId}`,
        });
    } catch (error) {
        console.error("Error while deleting food item:", error);
        return next(createHttpError(500, "Error while deleting food item"));
    }
};

export { createFoodItem, updateFoodItem, listFoods, getingSingleList, deleteFoodItem };
