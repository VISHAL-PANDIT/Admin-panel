import { RowDataPacket } from "mysql2";

export interface FoodItem extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}
