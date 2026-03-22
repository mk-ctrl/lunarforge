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
            data.leadEmail || '',
            data.m1Email || '',
            data.m2Email || ''
        ]);

        // Return success with team ID and password
        const result = { success: true, teamId: teamId, password: data.password };

        // ── SEND REGISTRATION EMAIL ─────────────────────────────────────────
        try {
            const emails = [data.leadEmail, data.m1Email, data.m2Email]
                .filter(e => e && e.trim() !== ''); // Filter out blanks
            if (emails.length > 0) {
                sendRegistrationEmail(emails.join(','), data.teamName, teamId, data.password, data.leadName);
            }
        } catch (mailErr) {
            // Send success anyway even if email fails
            result.mailStatus = 'Failed: ' + mailErr.message;
        }

        return ContentService
            .createTextOutput(JSON.stringify(result))
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
            'Lead Email',
            'Member 1 Email',
            'Member 2 Email'
        ]);

        // Bold headers
        sheet.getRange(1, 1, 1, 19).setFontWeight('bold');
        // Freeze header row
        sheet.setFrozenRows(1);
    } else {
        // Upgrade existing sheet to include emails safely at the end
        const lastCol = sheet.getLastColumn();
        if (lastCol > 0) {
            const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            if (headers.indexOf('Lead Email') === -1) {
                const startCol = Math.max(17, lastCol + 1);
                sheet.getRange(1, startCol, 1, 3)
                    .setValues([['Lead Email', 'Member 1 Email', 'Member 2 Email']])
                    .setFontWeight('bold');
            }
        }
    }

    return sheet;
}

/**
 * ══════════════════════════════════════════════════════
 * AUTOMATED EMAIL FUNCTION
 * Sends a welcome email with credentials to all members
 * ══════════════════════════════════════════════════════
 */
function sendRegistrationEmail(toEmails, teamName, teamId, password, leadName) {
    const subject = `Registration Confirmed: Lunar Forge 1.0`;
    
    const htmlBody = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #f8f9fa; padding: 30px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; letter-spacing: 1px;">LUNAR FORGE 1.0</h1>
            <p style="margin: 8px 0 0 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Registration Confirmation</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; margin-top: 0;">Dear ${leadName},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #444444;">
                We are pleased to confirm that <strong>Team ${teamName}</strong> has successfully registered for the Lunar Forge 1.0 Hackathon.
            </p>
            
            <!-- Credentials Box -->
            <div style="background-color: #f0f4f8; border-left: 4px solid #0056b3; border-radius: 4px; padding: 20px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #1a1a1a; font-size: 16px; margin-bottom: 15px;">Your Team Credentials</h3>
                <p style="font-size: 14px; color: #555555; margin-bottom: 15px; margin-top: 0;">Please retain these credentials to securely access the participant dashboard.</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; width: 35%; color: #333333; font-size: 14px;">TEAM ID</td>
                        <td style="padding: 8px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #0056b3;">${teamId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">PASSWORD</td>
                        <td style="padding: 8px 0; font-family: monospace; font-size: 16px; color: #1a1a1a;">${password}</td>
                    </tr>
                </table>
            </div>

            <!-- Important Links -->
            <h3 style="color: #1a1a1a; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Next Steps</h3>
            <ul style="font-size: 15px; line-height: 1.6; color: #444444; padding-left: 20px;">
                <li style="margin-bottom: 12px;"><strong>Communication:</strong> Join the <a href="https://chat.whatsapp.com/BOVOzMeJVxmFUtDsMeDH2e" style="color: #0056b3; text-decoration: none; font-weight: 600;">Official WhatsApp Channel</a> to receive all announcements.</li>
                <li style="margin-bottom: 12px;"><strong>Presentation Template:</strong> Download the required <a href="[INSERT_PPT_LINK_HERE]" style="color: #0056b3; text-decoration: none; font-weight: 600;">PPT Template</a> for your final submission.</li>
                <li style="margin-bottom: 12px;"><strong>Submissions:</strong> Log into the participant dashboard to submit your repository and demo video before the deadline.</li>
            </ul>
            
            <p style="margin-top: 30px; font-size: 15px; color: #444444; line-height: 1.6;">
                We look forward to your participation and innovation.<br><br>
                Sincerely,<br>
                <strong>The Lunar Forge Organizing Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 12px; color: #888888;">
                This is an automated administrative email.<br>
                Please do not reply directly to this address.
            </p>
        </div>
    </div>
    `;

    MailApp.sendEmail({
        to: toEmails,
        subject: subject,
        htmlBody: htmlBody,
        name: "Lunar Forge Hackathon",
        replyTo: "lunarforge10@gmail.com"
    });
}
