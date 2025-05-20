import express from 'express';
import { createFoodItem } from './foodItemController';



const foodItemRRouter = express.Router();

foodItemRRouter.post('/:id',createFoodItem)

export default foodItemRRouter;