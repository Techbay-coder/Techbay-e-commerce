import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.route';
import connectDB from './config/db';
import dotenv from 'dotenv';
//import { User } from './models/user-model';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', userRouter);

   app.get('/', (req, res) => {
    res.send('API is running...');
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  connectDB();