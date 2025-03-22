const express = require('express');
const { spawn } = require('cross-spawn');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Check if pyright is installed
router.get('/check', (req, res) => {
  try {
    const result = spawn.sync('pyright', ['--version'], { encoding: 'utf8' });
    
    if (result.error) {
      return res.status(404).json({
        status: 'error',
        message: 'Pyright is not installed',
        installed: false
      });
    }
    
    return res.json({
      status: 'success',
      message: 'Pyright is installed',
      installed: true,
      version: result.stdout.trim()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error checking pyright: ${error.message}`
    });
  }
});

// Analyze a Python file or directory
router.post('/analyze', (req, res) => {
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
        message: `File or directory not found: ${filePath}`
      });
    }
    
    // Run pyright on the file or directory
    const result = spawn.sync('pyright', ['--outputjson', filePath], { encoding: 'utf8' });
    
    let output;
    try {
      output = JSON.parse(result.stdout || result.stderr);
    } catch (e) {
      output = {
        raw: result.stdout || result.stderr,
        error: e.message
      };
    }
    
    return res.json({
      status: 'success',
      path: filePath,
      result: output
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error analyzing file: ${error.message}`
    });
  }
});

// Fix common Python issues in a file
router.post('/fix', (req, res) => {
  const { path: filePath, fixes } = req.body;
  
  if (!filePath || !fixes || !Array.isArray(fixes)) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing file path or fixes array'
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
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply the fixes
    fixes.forEach(fix => {
      if (fix.oldText && fix.newText) {
        content = content.replace(fix.oldText, fix.newText);
      }
    });
    
    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    return res.json({
      status: 'success',
      path: filePath,
      message: `Successfully applied ${fixes.length} fixes`
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Error fixing file: ${error.message}`
    });
  }
});

module.exports = router;