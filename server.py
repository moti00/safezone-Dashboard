import http.server
import socketserver
import os
import sys

# קביעת הפורט לשרת
PORT = 8000

# הגדרת ספריית העבודה הנוכחית כספריית השורש של השרת
HANDLER = http.server.SimpleHTTPRequestHandler

# יצירת שרת
with socketserver.TCPServer(("localhost", PORT), HANDLER) as httpd:
    print(f"\nשרת רץ בכתובת: http://localhost:{PORT}/")
    print("לחץ Ctrl+C כדי לעצור את השרת\n")
    
    # הרצת השרת
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nהשרת נעצר")
        httpd.server_close()
        sys.exit(0)