const express = require("express")
const cors = require("cors")
const path = require("path")
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();
const app = express();
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const reportRoutes = require("./routes/reportRoutes")

// cors
app.use(
    cors({
        // process.env.CLIENT_URL
        origin: "*",
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// connect to MongoDB
connectDB();

// Middleware
app.use(express.json())

// Routes

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/reports", reportRoutes)

// serve uploads static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
