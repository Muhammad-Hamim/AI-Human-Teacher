import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  ai_base_url: process.env.AI_BASE_URL,
  ai_api_key: process.env.AI_API_KEY,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,
  CLOUDINARY_COULD_NAME: process.env.CLOUDINARY_COULD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  admin_login_url: process.env.ADMIN_LOGIN_URL,
  user_login_url: process.env.USER_LOGIN_URL,
  nodemailer_email: process.env.NODEMAILER_EMAIL,
  nodemailer_pass: process.env.NODEMAILER_PASS,
};
