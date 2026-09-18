import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { findUserByEmail, findAdminByEmail, updateUser } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'metalurgica-fardin-secret-jwt-key-default-1983';

export interface AuthPayload {
  id: string;
  email: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function generateToken(user: { id: string; email: string; name?: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Efetue login novamente.' });
    return;
  }

  req.user = payload;
  next();
}

export async function authenticateAdmin(email: string, passwordPlain: string) {
  // Valida credenciais consultando a tabela users no Neon PostgreSQL
  const cleanEmail = email.toLowerCase().trim();
  const cleanPassword = passwordPlain.trim();

  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, message: 'Credenciais inválidas. Verifique o e-mail ou a senha.' };
  }

  const storedPassword = user.password || '';
  let matches = false;
  const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$') || storedPassword.startsWith('$2$');

  if (isBcrypt) {
    matches = await bcrypt.compare(cleanPassword, storedPassword);
  } else {
    matches = (cleanPassword === storedPassword);
    if (matches) {
      try {
        await updateUser(user.id, { passwordPlain: cleanPassword });
        console.log(`[Auth Migration] Senha em texto puro do usuário ${user.email} migrada para hash bcrypt.`);
      } catch (err) {
        console.error('[Auth Migration Error]', err);
      }
    }
  }

  if (!matches) {
    return { success: false, message: 'Credenciais inválidas. Verifique o e-mail ou a senha.' };
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    }
  };
}
