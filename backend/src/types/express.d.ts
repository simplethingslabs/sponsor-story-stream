import { UserPublic } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: UserPublic & { userId?: string };
      userId?: string;
    }
  }
}
