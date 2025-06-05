import express from 'express';
import { createFoodItem, deleteFoodItem, getAllFoodItem, getingSingleList, listFoods, updateFoodItem, getCategories } from './foodItemController';
import authenticate from '../middleware/authenticate';
import { uploadMiddleware } from "../config/cloudinary";

const foodItemRouter = express.Router();

// Get available categories
foodItemRouter.get('/categories', getCategories as express.RequestHandler);

// Get all food items (no authentication required)
foodItemRouter.get('/', getAllFoodItem as express.RequestHandler);

// Create food item with image upload
foodItemRouter.post('/:userId', authenticate, uploadMiddleware, createFoodItem as express.RequestHandler);

// Update food item with image upload
foodItemRouter.put('/:userId/:foodId', authenticate, uploadMiddleware, updateFoodItem as express.RequestHandler);

// Get single food item
foodItemRouter.get('/:userId/:foodId', authenticate, getingSingleList as express.RequestHandler);

// List all food items for a user
foodItemRouter.get('/user/:userId', authenticate, listFoods as express.RequestHandler);

// Delete food item
foodItemRouter.delete('/:userId/:foodId', authenticate, deleteFoodItem as express.RequestHandler);

export default foodItemRouter;