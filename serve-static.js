import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  console.log(`Request received for: ${req.url}`);

  // Default to serving index.html
  let filePath = "." + req.url;
  if (req.url === "/") {
    filePath = "./index.html";
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // File not found, serve index.html instead
        fs.readFile("./index.html", (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end("Error loading index.html");
            return;
          }
          console.log("Serving index.html as fallback");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(indexContent, "utf-8");
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
      return;
    }

    // Success
    console.log(`Successfully serving: ${filePath} as ${contentType}`);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf-8");
  });
});

const port = 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
