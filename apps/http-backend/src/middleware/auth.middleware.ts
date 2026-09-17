import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/index.js";

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.warn("Auth check failed: No token cookie or header present");
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            next();
        } catch (error: any) {
            console.error("Token verification failed:", error);
            
            if (error.name === 'TokenExpiredError') {
                res.clearCookie('token');
                return res.status(401).json({ 
                    message: "Session expired, please login again",
                    code: "TOKEN_EXPIRED"
                });
            }
            
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
