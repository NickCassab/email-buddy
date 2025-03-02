import os
import subprocess
import sys
import webbrowser
import time
import signal
import threading

def check_dependencies():
    """Check if required dependencies are installed"""
    # Check for Python dependencies
    try:
        import flask
        import google.oauth2
        import openai
        print("✓ Python dependencies found")
    except ImportError as e:
        print(f"Python dependency missing: {e}")
        print("Installing Python dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
    
    # Check for Node.js and npm
    try:
        # First try direct command
        try:
            subprocess.run(["node", "--version"], check=True, stdout=subprocess.PIPE)
            subprocess.run(["npm", "--version"], check=True, stdout=subprocess.PIPE)
            print("✓ Node.js and npm found")
        except (subprocess.SubprocessError, FileNotFoundError):
            # Try common installation paths on Windows
            node_paths = [
                r"C:\Program Files\nodejs\node.exe",
                r"C:\Program Files (x86)\nodejs\node.exe",
                os.path.expanduser("~\\AppData\\Roaming\\nvm\\current\\node.exe"),
                # Add the path where you know node is installed if different
            ]
            
            npm_paths = [
                r"C:\Program Files\nodejs\npm.cmd",
                r"C:\Program Files (x86)\nodejs\npm.cmd",
                os.path.expanduser("~\\AppData\\Roaming\\nvm\\current\\npm.cmd"),
                # Add the path where you know npm is installed if different
            ]
            
            node_found = False
            for path in node_paths:
                if os.path.exists(path):
                    print(f"✓ Node.js found at {path}")
                    node_found = True
                    break
                    
            npm_found = False
            for path in npm_paths:
                if os.path.exists(path):
                    print(f"✓ npm found at {path}")
                    npm_found = True
                    break
                    
            if not (node_found and npm_found):
                print("Warning: Node.js and npm are required but couldn't be found in path.")
                print("However, we'll continue since you mentioned they're installed.")
    except Exception as e:
        print(f"Warning: Error checking Node.js and npm: {e}")
        print("Continuing anyway since you mentioned they're installed...")

def setup_directories():
    """Ensure required directories exist"""
    os.makedirs("backend/credentials", exist_ok=True)
    
    # Create a .gitignore in credentials directory
    gitignore_path = os.path.join("backend", "credentials", ".gitignore")
    if not os.path.exists(gitignore_path):
        with open(gitignore_path, "w") as f:
            f.write("*\n!.gitignore\n")

def start_backend():
    """Start the Flask backend server"""
    os.chdir("backend")
    process = subprocess.Popen([sys.executable, "app.py"])
    os.chdir("..")
    return process

def start_frontend():
    """Start the React frontend dev server"""
    os.chdir("frontend")
    
    # Check if node_modules exists, if not run npm install
    if not os.path.exists("node_modules"):
        print("Installing frontend dependencies...")
        try:
            # Try using npm directly
            subprocess.run(["npm", "install"], check=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            # Try possible npm paths on Windows
            npm_paths = [
                r"C:\Program Files\nodejs\npm.cmd",
                r"C:\Program Files (x86)\nodejs\npm.cmd",
                os.path.expanduser("~\\AppData\\Roaming\\nvm\\current\\npm.cmd"),
            ]
            
            for npm_path in npm_paths:
                if os.path.exists(npm_path):
                    print(f"Using npm at {npm_path}")
                    subprocess.run([npm_path, "install"], check=True)
                    break
            else:
                print("Could not find npm. Please run 'npm install' manually in the frontend directory.")
    
    try:
        # Try using npm directly
        process = subprocess.Popen(["npm", "start"])
    except (subprocess.SubprocessError, FileNotFoundError):
        # Try possible npm paths on Windows
        npm_paths = [
            r"C:\Program Files\nodejs\npm.cmd",
            r"C:\Program Files (x86)\nodejs\npm.cmd",
            os.path.expanduser("~\\AppData\\Roaming\\nvm\\current\\npm.cmd"),
        ]
        
        for npm_path in npm_paths:
            if os.path.exists(npm_path):
                print(f"Using npm at {npm_path}")
                process = subprocess.Popen([npm_path, "start"])
                break
        else:
            raise FileNotFoundError("Could not find npm to start the frontend server")
    
    os.chdir("..")
    return process

def open_browser():
    """Open the browser to the application URL"""
    time.sleep(3)  # Wait for servers to start
    webbrowser.open("http://localhost:3000")

if __name__ == "__main__":
    print("Starting Email Assistant Application...")
    
    check_dependencies()
    setup_directories()
    
    # Start backend server
    print("Starting backend server...")
    backend_process = start_backend()
    
    try:
        # Start frontend server
        print("Starting frontend server...")
        frontend_process = start_frontend()
        
        # Open browser
        threading.Thread(target=open_browser).start()
    except Exception as e:
        print(f"Error starting frontend: {e}")
        print("Make sure Node.js and npm are properly installed and in your PATH")
    
    print("Application is running!")
    print("Press Ctrl+C to stop the servers")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Servers stopped. Goodbye!")