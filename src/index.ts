import express from 'express';
import cors from 'cors';
import userRouter from './routes/user.route';
import connectDB from './config/db';
import dotenv from 'dotenv';
import productRouter from "./routes/product.route";
import cartRouter from "./routes/cart.route"
import orderRouter from "./routes/order.route"

//import { User } from './models/user-model';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', userRouter);
app.use("/api/products", productRouter);
app.use("/api/cart",  cartRouter)
app.use('/api/orders', orderRouter);

   app.get('/', (req, res) => {
    res.send('API is running...');
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  connectDB();