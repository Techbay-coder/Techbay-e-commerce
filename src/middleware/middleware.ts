
import {Request, Response,NextFunction} from  'express';

export const inputUserAuth = (
    req: Request, 
    res: Response, 
    next: NextFunction
     ): void => {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters long" });
            return;
        }
        
        next();
};