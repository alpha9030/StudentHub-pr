import time
import urllib.request
import ssl
import json
import os

def run_sync():
    config_file = 'config.json'
    local_file = "student_logins.csv"
    
    # Load config
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
        else:
            print("config.json not found. Please create it first.")
            return
    except Exception as e:
        print(f"Error reading config.json: {e}")
        return

    live_url = config.get('LIVE_URL', '').rstrip('/')
    admin_key = config.get('ADMIN_KEY', 'admin')
    
    if not live_url:
        print("Please configure 'LIVE_URL' (e.g. 'https://yourwebsite.com') in config.json to start syncing.")
        return

    # Disable SSL verification for self-signed certificates
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    url = f"{live_url}/api/admin/download-csv?key={admin_key}"
    print(f"=======================================================")
    print(f"     Student Hub Live Login Sync Service")
    print(f"=======================================================")
    print(f"Syncing from: {live_url}")
    print(f"Writing to:   {local_file}")
    print(f"Polling interval: Every 5 seconds")
    print(f"Press Ctrl+C to stop syncing.")
    print(f"=======================================================")

    last_content = None
    while True:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx) as response:
                content = response.read().decode('utf-8')
                
            # If content changed, write to local file
            if content != last_content:
                try:
                    with open(local_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Synced successfully! Local CSV updated.")
                    last_content = content
                except PermissionError:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [WARNING] Cannot write to '{local_file}' because it is open in Excel or another program. Please close it to resume syncing.")
        except Exception as e:
            # Print a simpler message for rate limits/server down
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Sync warning/offline: {e}")
            
        time.sleep(5)

if __name__ == "__main__":
    try:
        run_sync()
    except KeyboardInterrupt:
        print("\nSync stopped by user.")
