/**
 * ══════════════════════════════════════════════════════
 * LUNAR FORGE 1.0 — SUBMISSION APPS SCRIPT
 * ══════════════════════════════════════════════════════
 *
 * ⚠️ IMPORTANT - CRITICAL SETUP STEPS:
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this entire code into the editor.
 * 3. Click "Deploy" -> "New deployment".
 * 4. Select type: "Web app".
 * 5. Description: "Submission API"
 * 6. Execute as: "Me" (Your email)
 * 7. Who has access: "Anyone" <--- IMPORTANT: Do NOT choose "Anyone with Google account".
 * 8. Click "Deploy".
 * 9. AUTHORIZE: You will see a popup. Click "Authorize Access", then select your account.
 *    If you see "Google hasn't verified this app", click "Advanced" -> "Go to Lunar Forge (unsafe)".
 * 10. COPY the "Web App URL" (it must end in /exec) and paste it into `dashboard.js`.
 *
 * NOTE: Every time you change this code, you MUST go to "Manage deployments" -> "Edit" -> "New Version" -> "Deploy" 
 * for the changes to take effect!
 */

const SHEET_NAME = 'Submissions';

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = getOrCreateSheet();
        const teamId = (data.teamId || '').toString().trim().toUpperCase();
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const values = sheet.getDataRange().getValues();
        const headers = values[0];
        
        // Find the "Team ID" column index regardless of case or spaces
        let teamIdColIndex = -1;
        for (let j = 0; j < headers.length; j++) {
            const header = (headers[j] || '').toString().trim().toUpperCase();
            if (header === 'TEAM ID') {
                teamIdColIndex = j;
                break;
            }
        }
        
        // If it's the very first row or header not found, index is -1
        let rowIndex = -1;

        if (teamId && teamIdColIndex !== -1) {
            // Search every row (skipping headers) for a match
            for (let i = 1; i < values.length; i++) {
                const sheetTeamId = (values[i][teamIdColIndex] || '').toString().trim().toUpperCase();
                if (sheetTeamId === teamId) {
                    rowIndex = i + 1; // 1-indexed for SpreadsheetApp
                    break;
                }
            }
        }

        const rowData = [
            timestamp,
            teamId,
            data.teamName || '',
            data.domain || '',
            data.problemStatement || '',
            data.githubUrl || '',
            data.videoUrl || ''
        ];

        let actionTaken = "";
        if (rowIndex > 0) {
            // Update existing row
            sheet.getRange(rowIndex, 1, 1, 7).setValues([rowData]);
            actionTaken = "Row Updated (Row Index: " + rowIndex + ")";
        } else {
            // New submission
            sheet.appendRow(rowData);
            actionTaken = "New Row Appended";
        }

        return ContentService
            .createTextOutput(JSON.stringify({ 
                success: true, 
                message: actionTaken,
                timestamp: timestamp,
                debug: {
                    sentTeamId: teamId,
                    foundColIndex: teamIdColIndex,
                    rowIndex: rowIndex
                }
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow([
            'Timestamp',
            'Team ID',
            'Team Name',
            'Domain',
            'Problem Statement',
            'GitHub URL',
            'Video URL'
        ]);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
    return sheet;
}

function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'Submission endpoint ready.' }))
        .setMimeType(ContentService.MimeType.JSON);
}
