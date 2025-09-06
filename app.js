const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Updated CORS configuration
app.use(cors({ origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', routes);
const revenueRoutes = require('./routes/revenueRoutes');
app.use('/api/revenues', revenueRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URL || "mongodb+srv://test123:test123@clustertest.fxqnf.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


module.exports = app;
