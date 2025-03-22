#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('cross-spawn');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create express app
const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const pythonRoutes = require('./routes/python');
const githubRoutes = require('./routes/github');
const fileRoutes = require('./routes/files');

app.use('/api/python', pythonRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/files', fileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Claude MCP Server',
    status: 'running',
    endpoints: {
      python: ['/api/python/analyze', '/api/python/fix'],
      github: ['/api/github/list', '/api/github/get', '/api/github/update'],
      files: ['/api/files/list', '/api/files/read', '/api/files/write', '/api/files/search']
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.green(`✓ Claude MCP Server running on port ${PORT}`));
  console.log(chalk.blue(`  Local: http://localhost:${PORT}/`));
  console.log(chalk.yellow(`  Ready to analyze Python code for The Everything App`));
});

module.exports = app;