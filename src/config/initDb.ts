import createTable from "../user/userTable";
import createFoodTable from "../foodItems/foodItemsTable";

const initializeDatabase = async () => {
    try {
        console.log('Initializing database...');
        
        // Create user table
        await createTable('user');
        
        // Create food-related tables
        await createFoodTable();
        
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

export default initializeDatabase; 