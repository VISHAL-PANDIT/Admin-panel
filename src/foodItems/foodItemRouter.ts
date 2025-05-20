import express, { RequestHandler } from 'express';
import { createFoodItem, listFoods, updateFoodItem } from './foodItemController';
import authenticate from '../middleware/authenticate';



const foodItemRRouter = express.Router();

foodItemRRouter.post('/:id',authenticate,createFoodItem);
foodItemRRouter.patch('/:userId/:foodId' , authenticate , updateFoodItem as RequestHandler);
foodItemRRouter.get('/:id',listFoods as RequestHandler)

export default foodItemRRouter;