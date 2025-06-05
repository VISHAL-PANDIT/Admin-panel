import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import getConnection from "../config/db";
import { FoodItem } from "./foodItemTypes";
import { RowDataPacket } from "mysql2";
import { cloudinary } from "../config/cloudinary";

// Extend Express Request type to include file property
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

interface ProductWithDetails extends FoodItem {
    categories: number[];
    specifications: string[];
    packaging: string[];
    applications: string[];
}

const createFoodItem = async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Received create food item request:', {
            body: req.body,
            file: req.file,
            params: req.params
        });

        const userId = parseInt(req.params.userId);
        const { 
            name, 
            short_description, 
            long_description, 
            price, 
            category
        } = req.body;

        // Handle arrays from form data
        const specifications = Array.isArray(req.body.specifications) 
            ? req.body.specifications 
            : req.body.specifications 
                ? [req.body.specifications]
                : [];

        const packaging = Array.isArray(req.body.packaging)
            ? req.body.packaging
            : req.body.packaging
                ? [req.body.packaging]
                : [];

        const applications = Array.isArray(req.body.applications)
            ? req.body.applications
            : req.body.applications
                ? [req.body.applications]
                : [];

        const file = req.file;

        // Validate required fields
        if (!userId) {
            console.error('User ID missing in URL');
            return next(createHttpError(400, "User ID is required in URL"));
        }

        if (!name || !short_description || !price || !category) {
            console.error('Missing required fields:', { name, short_description, price, category });
            return next(createHttpError(400, "Product name, short description, price, and category are required"));
        }

        // Validate price is a valid number
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            console.error('Invalid price:', price);
            return next(createHttpError(400, "Price must be a valid positive number"));
        }

        let db;
        try {
            db = await getConnection();

            // Verify user exists
            const [users] = await db.query<RowDataPacket[]>(
                "SELECT id, name FROM user WHERE id = ?",
                [userId]
            );

            if (users.length === 0) {
                console.error('User not found:', userId);
                return next(createHttpError(404, "User not found"));
            }

            const sellerName = users[0].name;

            // Upload image to Cloudinary if provided
            let imageUrl = null;
            let imagePublicId = null;
            
            if (file) {
                try {
                    console.log('Uploading image to Cloudinary...');
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'products',
                        resource_type: 'auto'
                    });
                    
                    imageUrl = result.secure_url;
                    imagePublicId = result.public_id;
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    return next(createHttpError(500, "Failed to upload image to Cloudinary"));
                }
            }

            // Start transaction
            await db.beginTransaction();

            try {
                console.log('Inserting product into database...');
                // Insert product
                const [result] = await db.query(
                    `INSERT INTO products (
                        user_id, seller_name, name, category, short_description, long_description, 
                        price, image_url, image_public_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, sellerName, name, category, short_description, long_description, 
                     price, imageUrl, imagePublicId]
                );

                const productId = (result as { insertId: number }).insertId;
                console.log('Product inserted with ID:', productId);

                // Insert product info
                console.log('Inserting product info...');
                await db.query(
                    `INSERT INTO product_info (
                        product_id, specifications, applications, packaging
                    ) VALUES (?, ?, ?, ?)`,
                    [
                        productId,
                        specifications.join('\n'),
                        applications.join('\n'),
                        packaging.join('\n')
                    ]
                );

                await db.commit();
                console.log('Transaction committed successfully');

                res.status(201).json({ 
                    message: "Product added successfully",
                    data: {
                        id: productId,
                        name,
                        category,
                        short_description,
                        long_description,
                        price,
                        sellerName,
                        imageUrl,
                        specifications,
                        packaging,
                        applications
                    }
                });
            } catch (error) {
                await db.rollback();
                console.error('Error in transaction:', error);
                throw error;
            }
        } catch (error) {
            console.error('Database error:', error);
            if (error instanceof Error) {
                if (error.message.includes('ER_DUP_ENTRY')) {
                    return next(createHttpError(400, 'Product with this name already exists'));
                }
                if (error.message.includes('ER_NO_SUCH_TABLE')) {
                    return next(createHttpError(500, 'Database table not found'));
                }
                if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
                    return next(createHttpError(500, 'Database access denied'));
                }
                if (error.message.includes('ER_BAD_FIELD_ERROR')) {
                    return next(createHttpError(500, 'Invalid field in database operation'));
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in createFoodItem:', error);
        return next(createHttpError(500, "Failed to add product"));
    }
};

const updateFoodItem = async (req: MulterRequest, res: Response, next: NextFunction) => {
    try {
        console.log('Received update food item request:', {
            body: req.body,
            file: req.file,
            params: req.params
        });

        const { 
            name, 
            short_description, 
            long_description, 
            price, 
            category,
            specifications,
            packaging,
            applications 
        } = req.body;
        const { userId, foodId } = req.params;
        const file = req.file;

        // Validate required fields
        if (!userId || !foodId) {
            console.error('Missing required params:', { userId, foodId });
            return next(createHttpError(400, "User ID and Product ID are required in URL"));
        }

        if (!name || !short_description || !price || !category) {
            console.error('Missing required fields:', { name, short_description, price, category });
            return next(createHttpError(400, "Product name, short description, price, and category are required"));
        }

        // Validate price is a valid number
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            console.error('Invalid price:', price);
            return next(createHttpError(400, "Price must be a valid positive number"));
        }

        // Handle arrays from form data
        const specs = Array.isArray(specifications) 
            ? specifications 
            : specifications 
                ? [specifications]
                : [];

        const packs = Array.isArray(packaging)
            ? packaging
            : packaging
                ? [packaging]
                : [];

        const apps = Array.isArray(applications)
            ? applications
            : applications
                ? [applications]
                : [];

        let db;
        try {
            db = await getConnection();
            await db.beginTransaction();

            // Get current product
            const [currentItem] = await db.query<FoodItem[] & RowDataPacket[]>(
                "SELECT * FROM products WHERE id = ? AND user_id = ?",
                [foodId, userId]
            );

            if (currentItem.length === 0) {
                await db.rollback();
                console.error('Product not found or not owned by user:', { foodId, userId });
                return next(createHttpError(404, "Product not found or not owned by user"));
            }

            let imageUrl = currentItem[0].image_url;
            let imagePublicId = currentItem[0].image_public_id;

            // Handle image update
            if (file) {
                try {
                    if (imagePublicId) {
                        await cloudinary.uploader.destroy(imagePublicId);
                    }
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'products',
                        resource_type: 'auto'
                    });
                    imageUrl = result.secure_url;
                    imagePublicId = result.public_id;
                    console.log('Image updated successfully:', imageUrl);
                } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    return next(createHttpError(500, "Failed to upload image to Cloudinary"));
                }
            }

            // Update product
            console.log('Updating product...');
            await db.query(
                `UPDATE products 
                 SET name = ?, category = ?, short_description = ?, long_description = ?, 
                     price = ?, image_url = ?, image_public_id = ?
                 WHERE id = ? AND user_id = ?`,
                [name, category, short_description, long_description, 
                 price, imageUrl, imagePublicId, foodId, userId]
            );

            // Update product info
            console.log('Updating product info...');
            await db.query(
                `UPDATE product_info 
                 SET specifications = ?, applications = ?, packaging = ?
                 WHERE product_id = ?`,
                [
                    specs.join('\n'),
                    apps.join('\n'),
                    packs.join('\n'),
                    foodId
                ]
            );

            await db.commit();
            console.log('Transaction committed successfully');

            res.status(200).json({ 
                message: "Product updated successfully",
                data: {
                    id: foodId,
                    name,
                    category,
                    short_description,
                    long_description,
                    price,
                    imageUrl,
                    specifications: specs,
                    packaging: packs,
                    applications: apps
                }
            });
        } catch (error) {
            if (db) {
                await db.rollback();
            }
            console.error('Database error:', error);
            if (error instanceof Error) {
                if (error.message.includes('ER_DUP_ENTRY')) {
                    return next(createHttpError(400, 'Product with this name already exists'));
                }
                if (error.message.includes('ER_NO_SUCH_TABLE')) {
                    return next(createHttpError(500, 'Database table not found'));
                }
                if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
                    return next(createHttpError(500, 'Database access denied'));
                }
                if (error.message.includes('ER_BAD_FIELD_ERROR')) {
                    return next(createHttpError(500, 'Invalid field in database operation'));
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in updateFoodItem:', error);
        return next(createHttpError(500, "Failed to update product"));
    }
};

const getingSingleList = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, foodId } = req.params;

    if (!userId || !foodId) {
        return next(createHttpError(400, "User ID and Product ID are required"));
  }

  try {
    const db = await getConnection();

        // Get product
        const [products] = await db.query<FoodItem[] & RowDataPacket[]>(
            `SELECT p.*, GROUP_CONCAT(pc.category_id) as category_ids
             FROM products p 
             LEFT JOIN product_categories pc ON p.id = pc.product_id
             WHERE p.user_id = ? AND p.id = ?
             GROUP BY p.id`,
            [userId, foodId]
    );

        if (products.length === 0) {
            return next(createHttpError(404, "Product not found"));
        }

        // Get product details
        const [details] = await db.query<RowDataPacket[]>(
            `SELECT type, content FROM product_details WHERE product_id = ?`,
            [foodId]
        );

        const product = products[0];
        const response: ProductWithDetails = {
            ...product,
            categories: product.category_ids ? product.category_ids.split(',').map(Number) : [],
            specifications: details.filter(d => d.type === 'specification').map(d => d.content),
            packaging: details.filter(d => d.type === 'packaging').map(d => d.content),
            applications: details.filter(d => d.type === 'application').map(d => d.content)
        };

        res.status(200).json({
            message: `Product with ID ${foodId}`,
            data: response
        });
  } catch (error) {
        console.error("Error while fetching product:", error);
        return next(createHttpError(500, "Error while fetching product"));
  }
};

const listFoods = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;

    if (!userId) {
        return next(createHttpError(400, "User ID is required in URL"));
    }

    try {
        const db = await getConnection();

        // Get products with categories
    const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
            `SELECT p.*, GROUP_CONCAT(pc.category_id) as category_ids
             FROM products p 
             LEFT JOIN product_categories pc ON p.id = pc.product_id
             WHERE p.user_id = ?
             GROUP BY p.id`,
      [userId]
    );

    if (rows.length === 0) {
            return res.status(200).json({ 
                message: "No products found for this user",
                data: []
            });
        }

        // Get all product details
        const productIds = rows.map(row => row.id);
        const [details] = await db.query<RowDataPacket[]>(
            "SELECT product_id, type, content FROM product_details WHERE product_id IN (?)",
            [productIds]
        );

        // Combine the data
        const productsWithDetails = rows.map(product => {
            const productDetails = details.filter(d => d.product_id === product.id);
            return {
                ...product,
                categories: product.category_ids ? product.category_ids.split(',').map(Number) : [],
                specifications: productDetails.filter(d => d.type === 'specification').map(d => d.content),
                packaging: productDetails.filter(d => d.type === 'packaging').map(d => d.content),
                applications: productDetails.filter(d => d.type === 'application').map(d => d.content)
            };
        });

    res.status(200).json({
            message: `Products for user ${userId}`,
            data: productsWithDetails,
    });
    } catch {
        return next(createHttpError(500, "Error while fetching products"));
  }
};

const getAllFoodItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Fetching all food items...');
    const db = await getConnection();

    // First check if tables exist
    const [tables] = await db.query<RowDataPacket[]>(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME IN ('products', 'product_info')`
    );

    if (tables.length < 2) {
      console.error('Required tables do not exist:', tables);
      return next(createHttpError(500, 'Database tables not properly initialized'));
    }

    console.log('Executing main query...');
    const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
      `SELECT p.*, pi.specifications, pi.applications, pi.packaging
       FROM products p 
       LEFT JOIN product_info pi ON p.id = pi.product_id`
    );

    console.log(`Found ${rows.length} products`);

    if (rows.length === 0) {
      return res.status(200).json({ 
        message: "No products found",
        data: []
      });
    }

    // Process the data
    const productsWithDetails = rows.map(product => {
      try {
        return {
          ...product,
          specifications: product.specifications ? product.specifications.split('\n').filter(Boolean) : [],
          packaging: product.packaging ? product.packaging.split('\n').filter(Boolean) : [],
          applications: product.applications ? product.applications.split('\n').filter(Boolean) : []
        };
      } catch (error) {
        console.error('Error processing product:', product.id, error);
        return {
          ...product,
          specifications: [],
          packaging: [],
          applications: []
        };
      }
    });

    console.log('Successfully processed all products');
    res.status(200).json({
      message: "All products",
      data: productsWithDetails,
    });
  } catch (error) {
    console.error("Error while fetching products:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('ER_NO_SUCH_TABLE')) {
        return next(createHttpError(500, 'Database tables not found'));
      }
      if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        return next(createHttpError(500, 'Database access denied'));
      }
      if (error.message.includes('ER_BAD_FIELD_ERROR')) {
        return next(createHttpError(500, 'Invalid field in database operation'));
      }
    }
    
    return next(createHttpError(500, "Error while fetching products"));
  }
};

const deleteFoodItem = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, foodId } = req.params;

  if (!userId || !foodId) {
    return next(createHttpError(400, "User ID and Product ID are required in URL"));
  }

  let db;
  try {
    console.log('Starting product deletion process:', { userId, foodId });
    db = await getConnection();
    await db.beginTransaction();

    // Get product to check for image and ownership
    const [rows] = await db.query<FoodItem[] & RowDataPacket[]>(
      "SELECT * FROM products WHERE user_id = ? AND id = ?",
      [userId, foodId]
    );

    if (rows.length === 0) {
      await db.rollback();
      console.error('Product not found or not owned by user:', { userId, foodId });
      return next(createHttpError(404, "Product not found or not owned by user"));
    }

    // Delete image from Cloudinary if exists
    if (rows[0].image_public_id) {
      try {
        console.log('Deleting image from Cloudinary:', rows[0].image_public_id);
        await cloudinary.uploader.destroy(rows[0].image_public_id);
        console.log('Image deleted successfully from Cloudinary');
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete from product_info first (due to foreign key constraint)
    console.log('Deleting from product_info table...');
    await db.query("DELETE FROM product_info WHERE product_id = ?", [foodId]);
    
    // Finally delete the product
    console.log('Deleting from products table...');
    await db.query("DELETE FROM products WHERE user_id = ? AND id = ?", [userId, foodId]);

    await db.commit();
    console.log('Product deletion completed successfully');

    res.status(200).json({
      message: "Product deleted successfully",
      data: {
        id: foodId,
        userId: userId
      }
    });
  } catch (error) {
    if (db) {
      await db.rollback();
    }
    console.error('Error while deleting product:', error);
    if (error instanceof Error) {
      if (error.message.includes('ER_NO_SUCH_TABLE')) {
        return next(createHttpError(500, 'Database tables not found'));
      }
      if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        return next(createHttpError(500, 'Database access denied'));
      }
      if (error.message.includes('ER_BAD_FIELD_ERROR')) {
        return next(createHttpError(500, 'Invalid field in database operation'));
      }
    }
    return next(createHttpError(500, "Error while deleting product"));
  }
};

const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = [
      'coconut',
      'pharmaceuticals',
      'methanol',
      'herbal_medicines',
      'animal_feed'
    ];

    res.status(200).json({
      message: "Available categories",
      data: categories
    });
  } catch (error) {
    console.error("Error while fetching categories:", error);
    return next(createHttpError(500, "Error while fetching categories"));
  }
};

export { 
    createFoodItem, 
    updateFoodItem, 
    listFoods, 
    getingSingleList, 
    deleteFoodItem,
    getAllFoodItem,
    getCategories 
};
