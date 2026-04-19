declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sub?: string;
        email?: string;
        user_metadata?: {
          full_name?: string;
        };
      };
    }
  }
}

export {};
