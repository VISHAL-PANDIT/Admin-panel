import express from 'express';
import { createFoodItem, deleteFoodItem, getingSingleList, listFoods, updateFoodItem } from './foodItemController';
import authenticate from '../middleware/authenticate';
import { uploadMiddleware } from "../config/cloudinary";

const foodItemRouter = express.Router();

// Create food item with image upload
foodItemRouter.post('/:userId', authenticate, uploadMiddleware, createFoodItem as express.RequestHandler);

// Update food item with image upload
foodItemRouter.put('/:userId/:foodId', authenticate, uploadMiddleware, updateFoodItem as express.RequestHandler);

// List all food items for a user
foodItemRouter.get('/:userId', authenticate, listFoods as express.RequestHandler);

// Get single food item
foodItemRouter.get('/:userId/:foodId', authenticate, getingSingleList as express.RequestHandler);

// Delete food item
foodItemRouter.delete('/:userId/:foodId', authenticate, deleteFoodItem as express.RequestHandler);

export default foodItemRouter;