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
 * 8. Copy the Web App URL and paste it into register.js (APPS_SCRIPT_URL)
 *
 * The script will automatically create a sheet named "Registrations"
 * with the correct headers on the first submission.
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

        // Append the registration data
        sheet.appendRow([
            timestamp,
            teamId,
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

        // Return success with team ID
        return ContentService
            .createTextOutput(JSON.stringify({ success: true, teamId: teamId }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle GET requests (for testing)
 */
function doGet() {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'Lunar Forge Registration API is running' }))
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
        // Add headers
        sheet.appendRow([
            'Timestamp',
            'Team ID',
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
        sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
        // Freeze header row
        sheet.setFrozenRows(1);
    }

    return sheet;
}
