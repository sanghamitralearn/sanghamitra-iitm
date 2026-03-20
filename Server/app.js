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
    origin: ['http://localhost:3000', 'https://sanghamitra-iitm.vercel.app'],
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
        secure: true,      // required for cross-site cookies
        sameSite: 'none',  // allow cross-domain (frontend ↔ backend on different Vercel URLs)
        httpOnly: true
    }
}));

// Connect to MongoDB
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => console.error("MongoDB connection error:", err));


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
