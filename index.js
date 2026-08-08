import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
// import userRoutes from "./routes/user.js";
// import ticketRoutes from "./routes/ticket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});