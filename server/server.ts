import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDb from './config/dbConfig';
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const courseRoutes = require('./routes/courseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const artistDashboardRoutes=require('./routes/artistDashboardRoutes');
const contactRoutes = require('./routes/contactRoutes');

import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';

dotenv.config();
connectDb();

const app=express();

//middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: ["http://localhost:5173", "https://art-verse-zeta.vercel.app"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
      ],
    methods: ["GET", "POST","PATCH", "PUT", "DELETE", "OPTIONS"]
})
);

app.options('*', cors());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));

//Routes
app.use("/api/auth", authRoutes);   
app.use("/api/users", userRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", buyerRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/artists", artistDashboardRoutes);
app.use('/api/contact', contactRoutes);
app.get("/", (req,res)=>{
    res.send("Hello World!");
})
//start server
const port=process.env.PORT || 5001;
app.listen(port, ()=>{
    console.log(`server listening on port ${port}`);
})