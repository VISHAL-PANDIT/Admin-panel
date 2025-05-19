import app from './src/app'
import { config } from './src/config/config';

const startServer = async () => {
    try {        
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
