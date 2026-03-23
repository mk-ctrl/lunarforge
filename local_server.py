"""
Lunar Forge 1.0 — Local Development Server
Serves static files AND saves registration/login data to local CSV files.
Uses file locking + upsert logic (update-or-insert by Team ID) for ACID safety.

Usage:  python local_server.py
        (replaces: python -m http.server 8080)
"""

import http.server
import json
import csv
import os
import threading
from datetime import datetime

PORT = 8080
REG_CSV = "registrations.csv"
LOGIN_CSV = "logins.csv"

# Thread lock for concurrent request safety
csv_lock = threading.Lock()

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


def upsert_csv(filepath, headers, new_row, key_col="Team ID"):
    """
    Atomic upsert: if a row with the same Team ID exists, update it.
    Otherwise append a new row. Uses lock for thread safety.
    """
    key_index = headers.index(key_col)
    key_value = new_row[key_index]

    with csv_lock:
        ensure_csv(filepath, headers)

        # Read all existing rows
        with open(filepath, "r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            all_rows = list(reader)

        # First row is headers
        header_row = all_rows[0] if all_rows else headers
        data_rows = all_rows[1:] if len(all_rows) > 1 else []

        # Find existing row by Team ID
        updated = False
        for i, row in enumerate(data_rows):
            if len(row) > key_index and row[key_index] == key_value:
                data_rows[i] = new_row  # Update in place
                updated = True
                break

        if not updated:
            data_rows.append(new_row)  # Insert new

        # Write everything back atomically (write to temp, then rename)
        tmp_path = filepath + ".tmp"
        with open(tmp_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(header_row)
            writer.writerows(data_rows)

        # Atomic replace
        os.replace(tmp_path, filepath)

    return "updated" if updated else "inserted"


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
                    row = [
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
                    ]
                    result = upsert_csv(REG_CSV, REG_HEADERS, row)
                    self._respond(200, {"success": True, "saved": "registration", "action": result})

                elif action == "login":
                    d = body.get("data", {})
                    row = [
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
                    ]
                    result = upsert_csv(LOGIN_CSV, LOGIN_HEADERS, row)
                    self._respond(200, {"success": True, "saved": "login", "action": result})

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
    print(f"  ACID: upsert by Team ID + thread locking enabled")
    http.server.HTTPServer(("", PORT), LunarForgeHandler).serve_forever()
