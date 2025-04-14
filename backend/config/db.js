const mongoose = require("mongoose")

// connect app to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log("MongoDB Connected");
    } catch (err) {
        console.log("Error connecting to MongoDB", err);
        process.exit(1);
    }
}

module.exports = connectDB;