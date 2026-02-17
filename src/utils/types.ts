import { Request } from 'express';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
