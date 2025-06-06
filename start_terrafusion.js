/**
 * TerraFusion Core AI Valuator - Startup Script
 * This script launches both the Python backend API and the frontend server
 */

const { spawn } = require("child_process");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

console.log(`${colors.bright}${colors.cyan}
 _______                   _____           _             
|__   __|                 |  __ \\         (_)            
   | | ___ _ __ _ __ __ _ | |__) |   _ ___ _  ___  _ __  
   | |/ _ \\ '__| '__/ _\` ||  ___/ | | / __| |/ _ \\| '_ \\ 
   | |  __/ |  | | | (_| || |   | |_| \\__ \\ | (_) | | | |
   |_|\\___|_|  |_|  \\__,_||_|    \\__,_|___/_|\\___/|_| |_|
                                                        
 Core AI Valuator - Starting Services...
${colors.reset}`);

// Start Python API
console.log(`${colors.yellow}[Backend] ${colors.reset}Starting Python API server...`);
const pythonProcess = spawn("python3", ["run_api.py"], {
  stdio: "pipe",
});

pythonProcess.stdout.on("data", (data) => {
  console.log(`${colors.yellow}[Backend] ${colors.reset}${data.toString().trim()}`);
});

pythonProcess.stderr.on("data", (data) => {
  console.error(`${colors.red}[Backend Error] ${colors.reset}${data.toString().trim()}`);
});

pythonProcess.on("close", (code) => {
  console.log(`${colors.red}[Backend] ${colors.reset}Process exited with code ${code}`);
});

// Wait a moment to start the frontend server
setTimeout(() => {
  console.log(`${colors.green}[Frontend] ${colors.reset}Starting frontend server...`);
  const frontendProcess = spawn("node", ["proxy.js"], {
    stdio: "pipe",
  });

  frontendProcess.stdout.on("data", (data) => {
    console.log(`${colors.green}[Frontend] ${colors.reset}${data.toString().trim()}`);
  });

  frontendProcess.stderr.on("data", (data) => {
    console.error(`${colors.red}[Frontend Error] ${colors.reset}${data.toString().trim()}`);
  });

  frontendProcess.on("close", (code) => {
    console.log(`${colors.red}[Frontend] ${colors.reset}Process exited with code ${code}`);
    // Kill the Python process when the frontend stops
    pythonProcess.kill();
  });
}, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log(`\n${colors.magenta}Shutting down TerraFusion Core AI Valuator...${colors.reset}`);
  pythonProcess.kill();
  process.exit();
});

console.log(
  `${colors.bright}${colors.cyan}TerraFusion Core AI Valuator - Services starting...${colors.reset}`
);
console.log(`${colors.dim}Press Ctrl+C to shut down all services.${colors.reset}`);
