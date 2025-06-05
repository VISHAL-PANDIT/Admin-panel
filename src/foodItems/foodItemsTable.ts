import getConnection from "../config/db";
import { RowDataPacket } from "mysql2";

const createFoodTable = async () => {
  try {
    const db = await getConnection();
    
    // Check if tables already exist
    const [tables] = await db.query<RowDataPacket[]>(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME IN ('products', 'product_info')`
    );

    const existingTables = tables.map(t => t.TABLE_NAME);

    if (!existingTables.includes('products')) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          seller_name VARCHAR(100) NOT NULL,
          name VARCHAR(100) NOT NULL,
          category VARCHAR(100) NOT NULL,
          short_description VARCHAR(255) NOT NULL,
          long_description TEXT,
          price DECIMAL(10,2) NOT NULL,
          image_url VARCHAR(255),
          image_public_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        );
      `);
    }

    if (!existingTables.includes('product_info')) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS product_info (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          specifications TEXT,
          applications TEXT,
          packaging TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);
    }

    console.log('Product tables structure verified');
    
    // Verify table structure
    const [columns] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME IN ('products', 'product_info')
    `);
    
    console.log('Table columns:', columns);

  } catch (error) {
    console.error('Error in createFoodTable:', error);
    throw error;
  }
};

export default createFoodTable;
