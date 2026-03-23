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
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // ── UPSERT: Check if Lead Phone already exists (prevents duplicates) ──
        const allData = sheet.getDataRange().getValues();
        const headers = allData[0];
        const leadPhoneCol = headers.indexOf('Lead Phone');
        const teamIdCol = headers.indexOf('Team ID');
        const passwordCol = headers.indexOf('Password');
        let existingRow = -1;
        let existingTeamId = '';
        let existingPassword = '';

        if (leadPhoneCol !== -1 && data.leadPhone) {
            for (let i = 1; i < allData.length; i++) {
                if (String(allData[i][leadPhoneCol]).trim() === String(data.leadPhone).trim()) {
                    existingRow = i + 1; // Sheet rows are 1-indexed
                    existingTeamId = allData[i][teamIdCol] || '';
                    existingPassword = allData[i][passwordCol] || '';
                    break;
                }
            }
        }

        let teamId, password, action;

        const rowData = [
            timestamp,
            '',  // Team ID placeholder
            '',  // Password placeholder
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
        ];

        if (existingRow > 0) {
            // UPDATE existing row — keep original Team ID & Password
            teamId = existingTeamId;
            password = existingPassword;
            rowData[1] = teamId;
            rowData[2] = password;
            sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
            action = 'updated';
        } else {
            // INSERT new row — generate new Team ID
            const lastRow = sheet.getLastRow();
            const teamNumber = lastRow;
            teamId = TEAM_ID_PREFIX + String(teamNumber).padStart(2, '0');
            password = data.password || '';
            rowData[1] = teamId;
            rowData[2] = password;
            sheet.appendRow(rowData);
            action = 'inserted';
        }

        // Return success with team ID and password
        const result = { success: true, teamId: teamId, password: password, action: action };

        // ── SEND REGISTRATION EMAIL (only for NEW registrations) ──
        if (action === 'inserted') {
            try {
                const emails = [data.leadEmail, data.m1Email, data.m2Email]
                    .filter(e => e && e.trim() !== '');
                if (emails.length > 0) {
                    sendRegistrationEmail(emails.join(','), data.teamName, teamId, password, data.leadName);
                }
            } catch (mailErr) {
                result.mailStatus = 'Failed: ' + mailErr.message;
            }
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
                            'team-name': data[i][headers.indexOf('Team Name')] || '',
                            teamName: data[i][headers.indexOf('Team Name')] || '',
                            teamSize: String(data[i][headers.indexOf('Team Size')] || '1'),
                            'lead-name': data[i][headers.indexOf('Lead Name')] || '',
                            leadName: data[i][headers.indexOf('Lead Name')] || '',
                            'lead-batch': data[i][headers.indexOf('Lead Batch')] || '',
                            leadBatch: data[i][headers.indexOf('Lead Batch')] || '',
                            'lead-phone': data[i][headers.indexOf('Lead Phone')] || '',
                            leadPhone: data[i][headers.indexOf('Lead Phone')] || '',
                            'm1-name': data[i][headers.indexOf('Member 1 Name')] || '',
                            m1Name: data[i][headers.indexOf('Member 1 Name')] || '',
                            'm1-batch': data[i][headers.indexOf('Member 1 Batch')] || '',
                            m1Batch: data[i][headers.indexOf('Member 1 Batch')] || '',
                            'm1-phone': data[i][headers.indexOf('Member 1 Phone')] || '',
                            m1Phone: data[i][headers.indexOf('Member 1 Phone')] || '',
                            'm2-name': data[i][headers.indexOf('Member 2 Name')] || '',
                            m2Name: data[i][headers.indexOf('Member 2 Name')] || '',
                            'm2-batch': data[i][headers.indexOf('Member 2 Batch')] || '',
                            m2Batch: data[i][headers.indexOf('Member 2 Batch')] || '',
                            'm2-phone': data[i][headers.indexOf('Member 2 Phone')] || '',
                            m2Phone: data[i][headers.indexOf('Member 2 Phone')] || '',
                            domain: data[i][headers.indexOf('Domain')] || '',
                            'problem-statement': data[i][headers.indexOf('Problem Statement')] || '',
                            problemStatement: data[i][headers.indexOf('Problem Statement')] || ''
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
    const subject = `🚀 Welcome to Lunar Forge 1.0! Your Registration is Confirmed`;
    
    const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #0b101e; padding: 30px 20px; text-align: center; border-bottom: 4px solid #00d4ff;">
            <h1 style="color: #ffffff; margin: 0; font-family: 'Bebas Neue', Arial, sans-serif; font-size: 32px; letter-spacing: 2px;">LUNAR FORGE 1.0</h1>
            <p style="color: #8fa0c1; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Official Registration Confirmation</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="margin-top: 0; color: #0b101e; font-size: 22px;">Welcome, ${leadName}!</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">
                Congratulations! <strong>Team ${teamName}</strong> is officially registered for the Lunar Forge 1.0 Hackathon. 
                We are incredibly excited to see the innovation and creativity your team will bring to the forge.
            </p>
            
            <!-- Credentials Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #00d4ff; padding-bottom: 8px; display: inline-block;">Your Team Credentials</h3>
                <p style="font-size: 14px; color: #64748b; margin-top: 5px;">Keep these exactly as shown. You will need them to log into the dashboard.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 35%;">TEAM ID</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #00d4ff; font-weight: bold; font-family: monospace; font-size: 16px;">${teamId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-weight: bold;">PASSWORD</td>
                        <td style="padding: 10px 0; font-family: monospace; font-size: 16px;">${password}</td>
                    </tr>
                </table>
            </div>

            <!-- Guidelines -->
            <h3 style="color: #0b101e; font-size: 18px; margin-top: 40px;">Important Guidelines & Rules 📜</h3>
            <ul style="font-size: 15px; line-height: 1.6; color: #4a5568; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Community:</strong> Every member must absolutely join the <a href="https://chat.whatsapp.com/BOVOzMeJVxmFUtDsMeDH2e" style="color: #00d4ff; font-weight: bold; text-decoration: none;">Official WhatsApp Channel</a>. All critical updates will be posted there.</li>
                <li style="margin-bottom: 10px;"><strong>Dashboard:</strong> You can log into the participant dashboard at any time to submit your PPT, GitHub Repo, and Demo Video links.</li>
                <li style="margin-bottom: 10px;"><strong>Submissions:</strong> You can continually update your submission links on the dashboard right up until the final deadline.</li>
                <li style="margin-bottom: 10px;"><strong>Originality:</strong> Zero-tolerance policy on plagiarism. Pre-built repos or copied code will result in immediate disqualification.</li>
            </ul>
            
            <p style="margin-top: 40px; font-size: 15px; color: #4a5568;">
                Prepare yourselves. It's time to build.<br>
                <br>
                Best of luck,<br>
                <strong>The Lunar Forge Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated email sent regarding Lunar Forge 1.0.<br>
                Please do not reply directly to this email.
            </p>
        </div>
    </div>
    `;

    MailApp.sendEmail({
        to: toEmails,
        subject: subject,
        htmlBody: htmlBody,
        name: "Lunar Forge 1.0",
        replyTo: "noreply@lunarforge.com"
    });
}
