import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("Missing MONGODB_URI in environment variables");
    }

    const connect = await mongoose.connect(mongoURI);
    console.log("Database connected:", connect.connection.host);
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

export default connectDb;
