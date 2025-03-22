const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// List files in a directory
router.post('/list', (req, res) => {
  const { path: dirPath } = req.body;
  
  if (!dirPath) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing directory path'
    });
  }
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({
        status: 'error',
        message: `Directory not found: ${dirPath}`
      });
    }
    
    // Check if path is a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({
        status: 'error',
        message: `Not a directory: ${dirPath}`
      });
    }
    
    // List files in the directory
    const files = fs.readdirSync(dirPath);
    
    // Get file details
    const fileDetails = files.map(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    return res.json({
      status: 'success',
      path: dirPath,
      files: fileDetails
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error listing files: ${error.message}`
    });
  }
});

// Read a file
router.post('/read', (req, res) => {
  const { path: filePath } = req.body;
  
  if (!filePath) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing file path'
    });
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: `File not found: ${filePath}`
      });
    }
    
    // Check if path is a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({
        status: 'error',
        message: `Not a file: ${filePath}`
      });
    }
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    return res.json({
      status: 'success',
      path: filePath,
      content
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error reading file: ${error.message}`
    });
  }
});

// Write to a file
router.post('/write', (req, res) => {
  const { path: filePath, content } = req.body;
  
  if (!filePath || content === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing file path or content'
    });
  }
  
  try {
    // Create parent directories if they don't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    return res.json({
      status: 'success',
      path: filePath,
      message: 'File written successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error writing file: ${error.message}`
    });
  }
});

// Search for files
router.post('/search', (req, res) => {
  const { path: dirPath, pattern } = req.body;
  
  if (!dirPath || !pattern) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing directory path or search pattern'
    });
  }
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({
        status: 'error',
        message: `Directory not found: ${dirPath}`
      });
    }
    
    // Check if path is a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({
        status: 'error',
        message: `Not a directory: ${dirPath}`
      });
    }
    
    // Recursive function to search for files
    const searchResults = [];
    const searchPattern = new RegExp(pattern, 'i');
    
    function searchDirectory(directory) {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (searchPattern.test(file)) {
          searchResults.push({
            name: file,
            path: filePath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
        
        if (stats.isDirectory()) {
          searchDirectory(filePath);
        }
      }
    }
    
    searchDirectory(dirPath);
    
    return res.json({
      status: 'success',
      path: dirPath,
      pattern,
      results: searchResults
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error searching for files: ${error.message}`
    });
  }
});

module.exports = router;