"""
Lunar Forge 1.0 — Local Development Server
Serves static files AND saves registration/login data to local CSV files.

Usage:  python local_server.py
        (replaces: python -m http.server 8080)
"""

import http.server
import json
import csv
import os
from datetime import datetime

PORT = 8080
REG_CSV = "registrations.csv"
LOGIN_CSV = "logins.csv"

REG_HEADERS = [
    "Timestamp", "Team ID", "Password", "Team Name", "Team Size",
    "Lead Name", "Lead Batch", "Lead Phone",
    "Member 1 Name", "Member 1 Batch", "Member 1 Phone",
    "Member 2 Name", "Member 2 Batch", "Member 2 Phone",
    "Domain", "Problem Statement",
    "Lead Email", "Member 1 Email", "Member 2 Email"
]

LOGIN_HEADERS = [
    "Timestamp", "Team ID", "Password", "Team Name", "Team Size",
    "Lead Name", "Lead Batch", "Lead Phone",
    "Member 1 Name", "Member 1 Batch", "Member 1 Phone",
    "Member 2 Name", "Member 2 Batch", "Member 2 Phone",
    "Domain", "Problem Statement", "Status"
]


def ensure_csv(filepath, headers):
    """Create CSV with headers if it doesn't exist."""
    if not os.path.exists(filepath):
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(headers)


class LunarForgeHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == "/save-csv":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length).decode("utf-8"))
                action = body.get("action", "")
                ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                if action == "registration":
                    d = body.get("data", {})
                    ensure_csv(REG_CSV, REG_HEADERS)
                    with open(REG_CSV, "a", newline="", encoding="utf-8") as f:
                        csv.writer(f).writerow([
                            ts,
                            d.get("teamId", ""),
                            d.get("password", ""),
                            d.get("teamName", ""),
                            d.get("teamSize", ""),
                            d.get("leadName", ""),
                            d.get("leadBatch", ""),
                            d.get("leadPhone", ""),
                            d.get("m1Name", ""),
                            d.get("m1Batch", ""),
                            d.get("m1Phone", ""),
                            d.get("m2Name", ""),
                            d.get("m2Batch", ""),
                            d.get("m2Phone", ""),
                            d.get("domain", ""),
                            d.get("problemStatement", ""),
                            d.get("leadEmail", ""),
                            d.get("m1Email", ""),
                            d.get("m2Email", ""),
                        ])
                    self._respond(200, {"success": True, "saved": "registration"})

                elif action == "login":
                    d = body.get("data", {})
                    ensure_csv(LOGIN_CSV, LOGIN_HEADERS)
                    with open(LOGIN_CSV, "a", newline="", encoding="utf-8") as f:
                        csv.writer(f).writerow([
                            ts,
                            d.get("teamId", ""),
                            d.get("password", ""),
                            d.get("teamName", d.get("team-name", "")),
                            d.get("teamSize", ""),
                            d.get("leadName", d.get("lead-name", "")),
                            d.get("leadBatch", d.get("lead-batch", "")),
                            d.get("leadPhone", d.get("lead-phone", "")),
                            d.get("m1Name", d.get("m1-name", "")),
                            d.get("m1Batch", d.get("m1-batch", "")),
                            d.get("m1Phone", d.get("m1-phone", "")),
                            d.get("m2Name", d.get("m2-name", "")),
                            d.get("m2Batch", d.get("m2-batch", "")),
                            d.get("m2Phone", d.get("m2-phone", "")),
                            d.get("domain", ""),
                            d.get("problemStatement", d.get("problem-statement", "")),
                            d.get("status", "success"),
                        ])
                    self._respond(200, {"success": True, "saved": "login"})

                else:
                    self._respond(400, {"error": "Unknown action"})

            except Exception as e:
                self._respond(500, {"error": str(e)})
        else:
            self._respond(404, {"error": "Not found"})

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    ensure_csv(REG_CSV, REG_HEADERS)
    ensure_csv(LOGIN_CSV, LOGIN_HEADERS)
    print(f"Lunar Forge local server running on http://localhost:{PORT}")
    print(f"  Registration CSV: {os.path.abspath(REG_CSV)}")
    print(f"  Login CSV:        {os.path.abspath(LOGIN_CSV)}")
    http.server.HTTPServer(("", PORT), LunarForgeHandler).serve_forever()
