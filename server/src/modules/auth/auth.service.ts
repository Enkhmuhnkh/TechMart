import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../shared/db';
import { AppError, Errors } from '../../shared/errors';
import { env } from '../../config/env';

interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: string;
  language_pref: string;
  created_at: Date;
}

function generateTokens(user: Pick<User, 'id' | 'email' | 'role'>) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
}

function sanitizeUser(user: User) {
  const { password_hash, ...safe } = user;
  void password_hash;
  return safe;
}

export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) {
  const existing = await queryOne<User>('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing) throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');

  const hash = await bcrypt.hash(data.password, 12);
  const user = await queryOne<User>(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, language_pref, created_at)
     VALUES ($1, $2, $3, $4, $5, 'customer', 'en', NOW())
     RETURNING *`,
    [uuidv4(), data.email, hash, data.full_name, data.phone ?? null]
  );

  if (!user) throw Errors.INTERNAL();
  const tokens = generateTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const user = await queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) throw Errors.UNAUTHORIZED('Invalid email or password');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw Errors.UNAUTHORIZED('Invalid email or password');

  const tokens = generateTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refreshToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [payload.userId]);
    if (!user) throw Errors.UNAUTHORIZED();
    return generateTokens(user);
  } catch {
    throw Errors.UNAUTHORIZED('Invalid refresh token');
  }
}

export async function getProfile(userId: string) {
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) throw Errors.NOT_FOUND('User');
  return sanitizeUser(user);
}

export async function updateProfile(userId: string, data: {
  full_name?: string;
  phone?: string;
  language_pref?: string;
}) {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (data.full_name !== undefined) { sets.push(`full_name = $${i++}`); vals.push(data.full_name); }
  if (data.phone !== undefined) { sets.push(`phone = $${i++}`); vals.push(data.phone); }
  if (data.language_pref !== undefined) { sets.push(`language_pref = $${i++}`); vals.push(data.language_pref); }
  if (!sets.length) throw Errors.VALIDATION('No fields to update');
  vals.push(userId);
  const user = await queryOne<User>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!user) throw Errors.NOT_FOUND('User');
  return sanitizeUser(user);
}
