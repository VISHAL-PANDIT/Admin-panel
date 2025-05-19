import express, { Request, Response } from 'express';

const app = express();


//routes
app.get('/',(req: Request , res: Response)=>{
    const statusCode = 200;
    res.status(statusCode).json({
        status: statusCode,
        message: "Welcome to API"
    })
})

export default app;