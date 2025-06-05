import { RowDataPacket } from "mysql2";

export interface FoodItem extends RowDataPacket {
  id: number;
  user_id: number;
  seller_name: string;
  name: string;
  short_description: string;
  long_description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  image_public_id: string | null;
  created_at: string;
  details?: string;
}

export interface Specification extends RowDataPacket {
  id: number;
  food_id: number;
  specification_text: string;
  created_at: string;
}

export interface Packaging extends RowDataPacket {
  id: number;
  food_id: number;
  packaging_text: string;
  created_at: string;
}

export interface Application extends RowDataPacket {
  id: number;
  food_id: number;
  application_text: string;
  created_at: string;
}

export interface FoodItemWithDetails extends FoodItem {
  specifications: string[];
  packaging: string[];
  applications: string[];
}
