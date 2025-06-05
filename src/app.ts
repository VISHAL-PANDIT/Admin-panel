import express, { Request, Response } from 'express';
import globalErrorHandler from './middleware/globalErrorHandler';
import userRouter from './user/userRouter';
import foodItemRRouter from './foodItems/foodItemRouter';
import { config } from './config/config';
import cors from 'cors';

export const app = express();

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configure CORS
app.use(cors({
    origin: config.frontendDomain
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req: Request, res: Response) => {
    const statusCode = 200;
    res.status(statusCode).json({
        status: statusCode,
        message: "Welcome to API"
    });
});

// API routes
app.use('/api/users', userRouter);
app.use('/api/food', foodItemRRouter);

// Error handling
app.use(globalErrorHandler);

export default app;