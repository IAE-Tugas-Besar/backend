import { Request } from "express";

// Extend Express Request to include file from multer
declare global {
    namespace Express {
        interface Request {
            file?: Multer.File;
            files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
        }
    }
}

export { };
