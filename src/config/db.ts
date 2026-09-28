import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURL = process.env.MONGO_URL;
    const databaseName = process.env.MONGO_DB_NAME;

    if (!mongoURL) {
      throw new Error("MONGO_URL is not defined");
    }

    if (!databaseName) {
      throw new Error("MONGO_DB_NAME is not defined");
    }

    await mongoose.connect(mongoURL, {
      dbName: databaseName,
    });

    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;