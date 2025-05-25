"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const dbConfig_1 = __importDefault(require("./config/dbConfig"));
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const courseRoutes = require('./routes/courseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const artistDashboardRoutes = require('./routes/artistDashboardRoutes');
const contactRoutes = require('./routes/contactRoutes');
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
(0, dbConfig_1.default)();
const app = (0, express_1.default)();
//middleware
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["set-cookie"],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
}));
app.options('*', (0, cors_1.default)());
app.use((0, express_fileupload_1.default)({
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
app.get("/", (req, res) => {
    res.send("Hello World!");
});
//start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});
