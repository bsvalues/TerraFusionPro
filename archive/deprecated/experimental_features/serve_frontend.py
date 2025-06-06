#!/usr/bin/env python3
"""
Simple HTTP Server to serve the frontend files
"""
import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files from the frontend directory"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers to allow the frontend to access the Python API
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    """Start the HTTP server for frontend files"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    if not os.path.exists(DIRECTORY):
        print(f"Error: {DIRECTORY} directory not found!")
        sys.exit(1)
        
    # Initialize the server
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"TerraFusion Frontend serving at http://localhost:{PORT}/")
        print(f"Serving files from: {os.path.abspath(DIRECTORY)}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.server_close()

if __name__ == "__main__":
    main()