import { RowDataPacket } from "mysql2";

export interface FoodItem extends RowDataPacket {
  id: number;
  user_id: number;
  seller_name: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  image_public_id: string | null;
  created_at: string;
}
