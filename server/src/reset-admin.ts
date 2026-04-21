import bcrypt from 'bcryptjs';
import { pool } from './config/database';
import dotenv from 'dotenv';
dotenv.config();

async function reset() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = 'admin@techmart.mn'",
    [hash]
  );
  console.log('✅ Password reset to: Admin1234!');
  process.exit(0);
}

reset().catch(console.error);