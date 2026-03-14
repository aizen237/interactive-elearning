// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const db = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const testRoutes = require('./src/routes/testRoutes'); 
const moduleRoutes = require('./src/routes/moduleRoutes');// NEW

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to receive JSON data in requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes); // NEW: Test protected routes
app.use('/api/modules', moduleRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Interactive E-Learning System Backend is Running!',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            test: '/api/test'
        }
    });
});

// Health check endpoint (includes database status)
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler - Must be after all routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler - Must be last
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Set port from .env or default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`🧪 Test Endpoints: http://localhost:${PORT}/api/test\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process (optional for production)
    // server.close(() => process.exit(1));
});
