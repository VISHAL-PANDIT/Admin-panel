import express from 'express';
import { createFoodItem } from './foodItemController';
import authenticate from '../middleware/authenticate';



const foodItemRRouter = express.Router();

foodItemRRouter.post('/:id',authenticate,createFoodItem)

export default foodItemRRouter;