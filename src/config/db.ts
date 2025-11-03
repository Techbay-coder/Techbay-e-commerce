import express from 'express';
import mongoose from 'mongoose';
//import dotenv from 'dotenv';
//import cors from 'cors' ;


const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      throw new Error('MONGO_URL is not defined in environment variables');
    }
    await mongoose.connect(mongoURL);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;