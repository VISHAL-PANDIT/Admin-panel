import app from './src/app'
import { config } from './src/config/config';
import initializeDatabase from './src/config/initDb';

const startServer = async () => {
    try {
        // Initialize database tables
        await initializeDatabase();
        
        const port = config.port;
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
