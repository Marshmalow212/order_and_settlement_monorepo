// import 'express-serve-static-core';

// declare module 'express-serve-static-core' {
//   interface Request {
//     userId?: number;
//   }
// }

// export {};


// src/types/express.d.ts

import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export {};
