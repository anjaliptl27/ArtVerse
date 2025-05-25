import mongoose from "mongoose";

const connectDb=async ()=>{
    try{
        const connect = await mongoose.connect("mongodb://localhost:27017/ArtVerse");
        console.log("Database connected:", connect.connection.host, connect.connection.name);
    }catch(error){
        console.log("Error connecting to database", error);
        process.exit(1);
    }
    
};

export default connectDb;