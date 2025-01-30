const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger.requestLogger);

// Routes
app.use('/api', routes);
app.use('/public', express.static(config.paths.public));

// Error handling
app.use(errorHandler);

module.exports = app;