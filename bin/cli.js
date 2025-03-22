#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const open = require('open');
const fs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Package info
const packageJson = require('../package.json');

program
  .name('claude-mcp')
  .description('Claude MCP - Monitoring and Code Quality for Python')
  .version(packageJson.version);

// Check for pyright
const checkPyright = () => {
  try {
    const result = spawn.sync('pyright', ['--version'], { encoding: 'utf8' });
    if (result.error) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

// Install pyright
const installPyright = () => {
  console.log(chalk.blue('Installing Pyright...'));
  const result = spawn.sync('npm', ['install', '-g', 'pyright'], { 
    stdio: 'inherit',
    encoding: 'utf8' 
  });
  
  if (result.error) {
    console.error(chalk.red(`Failed to install Pyright: ${result.error.message}`));
    return false;
  }
  
  console.log(chalk.green('Pyright installed successfully!'));
  return true;
};

// Start command
program
  .command('start')
  .description('Start the Claude MCP server')
  .option('-p, --port <port>', 'Port to run the server on', '3333')
  .option('-o, --open', 'Open the server in the browser', false)
  .action((options) => {
    // Check for pyright
    if (!checkPyright()) {
      console.log(chalk.yellow('Pyright not found. Attempting to install...'));
      if (!installPyright()) {
        console.error(chalk.red('Please install Pyright manually: npm install -g pyright'));
        process.exit(1);
      }
    }
    
    // Set the port
    process.env.PORT = options.port;
    
    // Start the server
    console.log(chalk.blue(`Starting Claude MCP server on port ${options.port}...`));
    
    // Import and start the server
    const server = require('../index');
    
    // Open in browser if requested
    if (options.open) {
      open(`http://localhost:${options.port}`);
    }
  });

// Analyze command
program
  .command('analyze <path>')
  .description('Analyze a Python file or directory')
  .action((filePath) => {
    // Check for pyright
    if (!checkPyright()) {
      console.log(chalk.yellow('Pyright not found. Attempting to install...'));
      if (!installPyright()) {
        console.error(chalk.red('Please install Pyright manually: npm install -g pyright'));
        process.exit(1);
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`File or directory not found: ${filePath}`));
      process.exit(1);
    }
    
    console.log(chalk.blue(`Analyzing ${filePath}...`));
    
    // Run pyright
    const result = spawn.sync('pyright', ['--outputjson', filePath], { 
      stdio: 'pipe',
      encoding: 'utf8' 
    });
    
    try {
      const output = JSON.parse(result.stdout || result.stderr);
      
      // Count problems
      const diagnostics = output.generalDiagnostics || [];
      const errors = diagnostics.filter(d => d.severity === 'error');
      const warnings = diagnostics.filter(d => d.severity === 'warning');
      const infos = diagnostics.filter(d => d.severity === 'information');
      
      console.log(chalk.green('\nAnalysis complete!'));
      console.log(chalk.red(`Errors: ${errors.length}`));
      console.log(chalk.yellow(`Warnings: ${warnings.length}`));
      console.log(chalk.blue(`Information: ${infos.length}`));
      
      // Print first 5 errors
      if (errors.length > 0) {
        console.log(chalk.red('\nErrors:'));
        errors.slice(0, 5).forEach((error, i) => {
          console.log(chalk.red(`${i + 1}. ${error.file}:${error.range.start.line + 1}:${error.range.start.character + 1} - ${error.message}`));
        });
        
        if (errors.length > 5) {
          console.log(chalk.red(`... and ${errors.length - 5} more errors`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error parsing Pyright output: ${error.message}`));
      console.log(result.stdout || result.stderr);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new Claude MCP project')
  .action(() => {
    // Create pyrightconfig.json
    const pyrightConfig = {
      "include": ["."],
      "exclude": ["**/node_modules", "**/__pycache__"],
      "reportMissingImports": true,
      "reportMissingTypeStubs": false,
      "pythonVersion": "3.9",
      "typeCheckingMode": "basic"
    };
    
    fs.writeFileSync('pyrightconfig.json', JSON.stringify(pyrightConfig, null, 2));
    console.log(chalk.green('Created pyrightconfig.json'));
    
    // Create .env file
    if (!fs.existsSync('.env')) {
      fs.writeFileSync('.env', 'PORT=3333\n# Add your GitHub token here\n# GITHUB_TOKEN=your_token_here\n');
      console.log(chalk.green('Created .env file'));
    }
    
    console.log(chalk.green('\nInitialization complete!'));
    console.log(chalk.blue('Run `claude-mcp start` to start the server'));
  });

// Parse arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.help();
}