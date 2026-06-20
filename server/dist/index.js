import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import groupRoutes from './routes/groups.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cpk';
// CORS setup
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());
// Initialize Clerk Middleware globally (AD-3)
app.use(clerkMiddleware());
// Mount API routes
app.use('/api/groups', groupRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date() });
});
// Database connection & start server
mongoose.connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
