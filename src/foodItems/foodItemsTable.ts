import getConnection from "../config/db";

const createFoodTable = async () => {
  try {
    const db = await getConnection();
    console.log('Database connection established');

    // Create the table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS food (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        seller_name VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(255),
        image_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
    `);

    console.log('Food table structure verified');
    
    // Verify table structure
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'food'
    `);
    
    console.log('Table columns:', columns);

  } catch (error) {
    console.error('Error in createFoodTable:', error);
    throw error;
  }
};

export default createFoodTable;
