const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./model/userSchema');
const authRouter = require('./router/auth');
const analysisRouter = require('./router/analysis');
const dotenv = require('dotenv');
const cors = require('cors');

const app = express();

// Load environment variables
dotenv.config({ path: './.env' });

// If environment variables are still undefined, try loading from parent directory
if (!process.env.DATABASE || !process.env.SECRET_KEY) {
    console.log('Environment variables not found, trying to load from parent directory...');
    dotenv.config({ path: '../.env' });
    console.log('DATABASE (after retry):', process.env.DATABASE);
    console.log('SECRET_KEY (after retry):', process.env.SECRET_KEY);
    console.log('PORT (after retry):', process.env.PORT);
}

// Middleware setup
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://sanghamitra-iitm.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('trust proxy', 1); // Required for Vercel / reverse proxies

app.use(session({
    name: 'sessionId',
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true
    }
}));

// Connect to MongoDB — cache connection across serverless invocations
let isConnected = false;
async function connectDB() {
    if (isConnected && mongoose.connection.readyState === 1) return;
    try {
        await mongoose.connect(process.env.DATABASE, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}
connectDB();


// Ensure DB is connected on every request (handles serverless cold starts)
app.use(async (req, res, next) => {
    try { await connectDB(); next(); }
    catch (err) { res.status(503).json({ error: 'Database unavailable' }); }
});

// Routes
app.use('/api', authRouter);
app.use('/api', analysisRouter);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Example route setting a cookie
app.get('/api/example', function(req, res) {
    res.cookie('name', 'tutorialsPoint');
    res.send("Cookies are set");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
