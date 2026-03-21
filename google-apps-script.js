/**
 * ══════════════════════════════════════════════════════
 * LUNAR FORGE 1.0 — GOOGLE APPS SCRIPT
 * ══════════════════════════════════════════════════════
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Replace the default code with this entire file
 * 3. Click "Deploy" → "New deployment"
 * 4. Select type: "Web app"
 * 5. Set "Execute as" → "Me"
 * 6. Set "Who has access" → "Anyone"
 * 7. Click "Deploy" and authorize when prompted
 * 8. Copy the Web App URL and paste it into register.js AND login.js (APPS_SCRIPT_URL)
 *
 * Make sure to clear your existing sheet or manually add the "Password" header if you already created it!
 */

// Sheet name
const SHEET_NAME = 'Registrations';
const TEAM_ID_PREFIX = 'CN-LF';

/**
 * Handle incoming POST requests from the registration form
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = getOrCreateSheet();

        // Generate team ID based on current row count
        const lastRow = sheet.getLastRow();
        const teamNumber = lastRow; // Row 1 = headers, so row 2 = team 1
        const teamId = TEAM_ID_PREFIX + String(teamNumber).padStart(2, '0');

        // Timestamp
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // Append the registration data (INCLUDING PASSWORD)
        sheet.appendRow([
            timestamp,
            teamId,
            data.password || '',
            data.teamName || '',
            data.teamSize || '',
            data.leadName || '',
            data.leadBatch || '',
            data.leadPhone || '',
            data.m1Name || '',
            data.m1Batch || '',
            data.m1Phone || '',
            data.m2Name || '',
            data.m2Batch || '',
            data.m2Phone || '',
            data.domain || '',
            data.problemStatement || '',
        ]);

        // Return success with team ID and password
        return ContentService
            .createTextOutput(JSON.stringify({ success: true, teamId: teamId, password: data.password }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle GET requests (for testing and LOGIN)
 */
function doGet(e) {
    // Check if it's a login request
    if (e && e.parameter && e.parameter.action === 'login') {
        try {
            const sheet = getOrCreateSheet();
            const teamId = e.parameter.teamId;
            const password = e.parameter.password;
            
            const data = sheet.getDataRange().getValues();
            const headers = data[0];
            
            const teamIdIndex = headers.indexOf('Team ID');
            const passwordIndex = headers.indexOf('Password');
            
            if (teamIdIndex === -1 || passwordIndex === -1) {
                return ContentService.createTextOutput(JSON.stringify({ 
                    success: false, 
                    message: 'Server error: Password or Team ID column missing in Sheets.' 
                })).setMimeType(ContentService.MimeType.JSON);
            }

            // Search for the Team ID
            for (let i = 1; i < data.length; i++) {
                if (data[i][teamIdIndex] === teamId) {
                    if (data[i][passwordIndex] === password) {
                        // Success! Return user data in the same format as registration
                        const sessionData = {
                            teamId: data[i][teamIdIndex],
                            password: data[i][passwordIndex],
                            teamName: data[i][headers.indexOf('Team Name')] || '',
                            teamSize: data[i][headers.indexOf('Team Size')] || '',
                            leadName: data[i][headers.indexOf('Lead Name')] || '',
                            domain: data[i][headers.indexOf('Domain')] || '',
                            problemStatement: data[i][headers.indexOf('Problem Statement')] || ''
                            // Add more fields if the dashboard needs them
                        };
                        return ContentService.createTextOutput(JSON.stringify({ 
                            success: true, 
                            data: sessionData 
                        })).setMimeType(ContentService.MimeType.JSON);
                    } else {
                        return ContentService.createTextOutput(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid Password.' 
                        })).setMimeType(ContentService.MimeType.JSON);
                    }
                }
            }
            
            return ContentService.createTextOutput(JSON.stringify({ 
                success: false, 
                message: 'Invalid Team ID.' 
            })).setMimeType(ContentService.MimeType.JSON);
            
        } catch (error) {
           return ContentService.createTextOutput(JSON.stringify({ 
               success: false, 
               message: error.message 
           })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    // Default response for simple testing
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'Lunar Forge API is running. Login endpoint ready.' }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get existing sheet or create one with headers
 */
function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers (including Password)
        sheet.appendRow([
            'Timestamp',
            'Team ID',
            'Password',
            'Team Name',
            'Team Size',
            'Lead Name',
            'Lead Batch',
            'Lead Phone',
            'Member 1 Name',
            'Member 1 Batch',
            'Member 1 Phone',
            'Member 2 Name',
            'Member 2 Batch',
            'Member 2 Phone',
            'Domain',
            'Problem Statement',
        ]);

        // Bold headers
        sheet.getRange(1, 1, 1, 16).setFontWeight('bold');
        // Freeze header row
        sheet.setFrozenRows(1);
    }

    return sheet;
}
