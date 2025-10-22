import express from 'express';
import cors from 'cors';
import router from './routes/user.routes';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { User } from './models/user-model';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 300;


app.use(cors());
app.use(express.json());
app.use('/api', router);

app.get('/', async (req, res) => {
  try {
    const newUser = await User.create({
      name: "Azeez Adigun",
      email: "zheyzed@gmail.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "password123"
    });
    
    res.status(201).json({ 
      message: "User created successfully", 
      user: newUser 
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error?.message ?? String(error) });
    }
    connectDB();
    
  app.listen(PORT, () => {
    console.log(`Server running on port :http://localhost:${PORT}`);
  });
});