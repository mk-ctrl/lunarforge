/**
 * ══════════════════════════════════════════════════════
 * LUNAR FORGE 1.0 — SUBMISSION APPS SCRIPT
 * ══════════════════════════════════════════════════════
 *
 * ⚠️  IMPORTANT - CRITICAL SETUP STEPS:
 * 1. Go to https://script.google.com and create / open your project.
 * 2. Paste this entire code into the editor.
 * 3. Click "Deploy" -> "Manage deployments" -> Edit -> "New Version" -> "Deploy"
 *    (or "New deployment" if first time)
 * 4. Type: "Web app" | Execute as: "Me" | Who has access: "Anyone"
 * 5. Copy the Web App URL and paste it into dashboard.js as SUBMISSION_APPS_SCRIPT_URL.
 *
 * DRIVE FOLDER:
 *   PPT files are saved to the folder whose ID is stored in DRIVE_FOLDER_ID below.
 *   The folder URL is: https://drive.google.com/drive/folders/1ofgE5ZyKJkyFkAgh_Vjn-3281kdikgGV
 *
 * NOTE: Every time you change this code you MUST re-deploy with a new version!
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const SHEET_NAME      = 'Submissions';
const DRIVE_FOLDER_ID = '1ofgE5ZyKJkyFkAgh_Vjn-3281kdikgGV'; // ← your Drive folder

/**
 * TEMPORARY — Run this ONCE from the Apps Script editor to authorize Drive access.
 * After you see "File created successfully!" in the logs, delete this function and re-deploy.
 */
function testDriveAccess() {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('Folder found: ' + folder.getName());
    
    // Explicitly create a dummy file to force the "drive" scope
    const dummyFile = folder.createFile('dummy.txt', 'test');
    Logger.log('File created successfully! You can delete dummy.txt now.');
    dummyFile.setTrashed(true); // Clean up immediately
}


// ─────────────────────────────────────────────────────────────────────────────
// doPost  — handles both project submissions AND PPT uploads (via JSON/Base64)
// ─────────────────────────────────────────────────────────────────────────────
function doPost(e) {
    try {
        // Guard — Apps Script only populates e.postData for real POST requests
        if (!e || !e.postData || !e.postData.contents) {
            return jsonResp(false, 'No POST body received.');
        }

        const data = JSON.parse(e.postData.contents);

        // ── PPT UPLOAD ──────────────────────────────────────────────────────
        // Frontend sends: { action:'uploadPPT', teamId, fileBase64, fileName, mimeType }
        if (data.action === 'uploadPPT') {
            return handlePPTUpload(data);
        }

        // ── REGULAR SUBMISSION (upsert GitHub URL + Video URL) ──────────────
        const sheet     = getOrCreateSheet();
        const teamId    = (data.teamId || '').toString().trim().toUpperCase();
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const values  = sheet.getDataRange().getValues();
        const headers = values[0];

        const teamIdColIndex = colIndex(headers, 'TEAM ID');
        let rowIndex = -1;

        if (teamId && teamIdColIndex !== -1) {
            for (let i = 1; i < values.length; i++) {
                const sheetTeamId = (values[i][teamIdColIndex] || '').toString().trim().toUpperCase();
                if (sheetTeamId === teamId) {
                    rowIndex = i + 1;
                    break;
                }
            }
        }

        // Preserve existing PPT URL so updating GitHub/video doesn't wipe it
        let existingPptUrl = '';
        if (rowIndex > 0) {
            const pptColIdx = colIndex(headers, 'PPT URL');
            if (pptColIdx !== -1) {
                existingPptUrl = (values[rowIndex - 1][pptColIdx] || '').toString();
            }
        }

        const rowData = [
            timestamp,
            teamId,
            data.teamName         || '',
            data.domain           || '',
            data.problemStatement || '',
            data.githubUrl        || '',
            data.videoUrl         || '',
            existingPptUrl
        ];

        let actionTaken = '';
        if (rowIndex > 0) {
            sheet.getRange(rowIndex, 1, 1, 8).setValues([rowData]);
            actionTaken = 'Row Updated (Row Index: ' + rowIndex + ')';
        } else {
            sheet.appendRow(rowData);
            actionTaken = 'New Row Appended';
        }

        return ContentService
            .createTextOutput(JSON.stringify({
                success   : true,
                message   : actionTaken,
                timestamp : timestamp,
                debug: { sentTeamId: teamId, foundColIndex: teamIdColIndex, rowIndex: rowIndex }
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// handlePPTUpload  — decodes Base64 file, saves to Drive, records URL in sheet
// ─────────────────────────────────────────────────────────────────────────────
function handlePPTUpload(data) {
    try {
        const teamId = (data.teamId || '').toString().trim().toUpperCase();
        if (!teamId) return jsonResp(false, 'Missing teamId.');

        const fileBase64 = data.fileBase64;
        if (!fileBase64) return jsonResp(false, 'No file data received.');

        const fileName = sanitizeFileName(teamId, data.fileName || 'presentation.pptx');
        const mimeType = data.mimeType || 'application/octet-stream';

        // Save to Drive folder
        const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

        // Trash any previous upload for this team (keeps folder clean)
        const existing = folder.getFilesByName(fileName);
        while (existing.hasNext()) { existing.next().setTrashed(true); }

        // Decode Base64 → Blob → Drive file
        const bytes     = Utilities.base64Decode(fileBase64);
        const blob      = Utilities.newBlob(bytes, mimeType, fileName);
        const driveFile = folder.createFile(blob);
        
        // Remove setSharing() — if you have a Workspace domain (school/corporate), 
        // attempting to set files to "Anyone with the link" programmatically will 
        // throw "Access denied". Instead, just share the *folder* manually in Drive, 
        // and all files inside will inherit that permission automatically.

        const fileUrl = driveFile.getUrl();

        // Write URL into Submissions sheet
        recordPptUrl(teamId, fileUrl);

        return jsonResp(true, 'PPT uploaded successfully.', { fileUrl: fileUrl, teamId: teamId });

    } catch (err) {
        return jsonResp(false, err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// doGet  — handles login (existing) AND getPPTStatus (new)
// ─────────────────────────────────────────────────────────────────────────────
function doGet(e) {
    const action = e && e.parameter && e.parameter.action;

    // ── GET PPT STATUS ───────────────────────────────────────────────────────
    if (action === 'getPPTStatus') {
        try {
            const teamId = ((e.parameter.teamId) || '').trim().toUpperCase();
            if (!teamId) return jsonResp(false, 'Missing teamId.');

            const sheet  = getOrCreateSheet();
            const values = sheet.getDataRange().getValues();
            const headers = values[0];

            const teamIdIdx = colIndex(headers, 'TEAM ID');
            const pptIdx    = colIndex(headers, 'PPT URL');

            for (let i = 1; i < values.length; i++) {
                const rowTeamId = (values[i][teamIdIdx] || '').toString().trim().toUpperCase();
                if (rowTeamId === teamId) {
                    const url = pptIdx !== -1 ? (values[i][pptIdx] || '').toString().trim() : '';
                    if (url) {
                        return jsonResp(true, 'PPT found.', { hasPPT: true, fileUrl: url });
                    }
                    return jsonResp(true, 'No PPT yet.', { hasPPT: false });
                }
            }
            // Team not found in submissions yet (fine — no PPT)
            return jsonResp(true, 'Team not in submissions.', { hasPPT: false });

        } catch (err) {
            return jsonResp(false, err.message, { hasPPT: false });
        }
    }

    // Default / other actions
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'Submission endpoint ready.' }))
        .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get-or-create the Submissions sheet with 8 columns (now includes PPT URL). */
function getOrCreateSheet() {
    const ss  = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow([
            'Timestamp', 'Team ID', 'Team Name', 'Domain',
            'Problem Statement', 'GitHub URL', 'Video URL', 'PPT URL'
        ]);
        sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
        sheet.setFrozenRows(1);
    } else {
        // Ensure the PPT URL column exists (backwards-compatible upgrade)
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (colIndex(headers, 'PPT URL') === -1) {
            const nextCol = sheet.getLastColumn() + 1;
            sheet.getRange(1, nextCol).setValue('PPT URL').setFontWeight('bold');
        }
    }

    return sheet;
}

/** Write / update the PPT URL for a given team in the Submissions sheet. */
function recordPptUrl(teamId, fileUrl) {
    const sheet  = getOrCreateSheet();
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    const teamIdIdx = colIndex(headers, 'TEAM ID');
    const pptIdx    = colIndex(headers, 'PPT URL');
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    for (let i = 1; i < values.length; i++) {
        const rowTeamId = (values[i][teamIdIdx] || '').toString().trim().toUpperCase();
        if (rowTeamId === teamId) {
            sheet.getRange(i + 1, pptIdx + 1).setValue(fileUrl);
            // Also update timestamp
            sheet.getRange(i + 1, 1).setValue(timestamp);
            return;
        }
    }

    // Team not in Submissions sheet yet — create a minimal row
    const newRow = [];
    for (let j = 0; j < Math.max(pptIdx + 1, 8); j++) newRow.push('');
    newRow[0]          = timestamp;
    newRow[teamIdIdx]  = teamId;
    newRow[pptIdx]     = fileUrl;
    sheet.appendRow(newRow);
}

/** Return a column index (0-based) by header name (case-insensitive). */
function colIndex(headers, name) {
    const target = name.toUpperCase();
    for (let j = 0; j < headers.length; j++) {
        if ((headers[j] || '').toString().trim().toUpperCase() === target) return j;
    }
    return -1;
}

/** Build a clean JSON ContentService response. */
function jsonResp(success, message, extra) {
    const obj = Object.assign({ success: success, message: message }, extra || {});
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

/** Build a safe filename: TEAMID_presentation.ext */
function sanitizeFileName(teamId, originalName) {
    const ext = (originalName.match(/\.[^.]+$/) || ['.pptx'])[0].toLowerCase();
    return teamId + '_presentation' + ext;
}


