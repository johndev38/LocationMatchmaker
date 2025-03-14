import 'express';
import { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
      login(user: User, callback: (err: any) => void): void;
      logout(callback: (err: any) => void): void;
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
} 