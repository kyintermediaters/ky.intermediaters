# Google Sheets Backend Setup Guide

Follow these steps to connect your website to Google Sheets. This will allow the registration form to save data directly into a spreadsheet, and the admin dashboard to read it.

## Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new Blank spreadsheet.
2. Name it something like "KY Intermediater's DB".

## Step 2: Open Apps Script
1. In the Google Sheet, click on **Extensions** > **Apps Script** in the top menu.
2. A new tab will open with the script editor.
3. Delete any existing code in the editor.

## Step 3: Paste the Code
Copy and paste the following code into the script editor:

```javascript
const SHEET_NAME = 'Registrations';
const OTP_SHEET = 'OTP_Cache';

// -------------------------------------------------------------
// SETUP & UTILITIES
// -------------------------------------------------------------

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Define columns 1-23
  const headers = [
    'Timestamp', 'Name', 'Email', 'Phone', 'Interest', 'Capital', 'Location', 
    'Occupation', 'Experience', 'Motivation', 'Goal', 'Timeline', 'Time Comm.', 
    'Venture Type', 'Risk', 'Status', 'Notes', 'Score', 'ReminderDate', 
    'Documents', 'ActivityLog', 'Agent', 'ClientID'
  ];
  
  // Set headers safely without overwriting data if it exists
  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  if (existingHeaders[0] !== 'Timestamp') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange("A1:W1").setFontWeight("bold");
  } else if (existingHeaders.length < headers.length) {
      // Append missing headers
      const missing = headers.slice(existingHeaders.length);
      if (missing.length > 0) {
          sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      }
  }

  let otpSheet = ss.getSheetByName(OTP_SHEET);
  if (!otpSheet) {
    otpSheet = ss.insertSheet(OTP_SHEET);
    otpSheet.appendRow(['Timestamp', 'Email', 'OTP']);
    otpSheet.hideSheet(); // Hide it so it doesn't clutter the UI
  }
}

function calculateLeadScore(data) {
    let score = 50; // base score
    if (data.budget === '50000+') score += 20;
    else if (data.budget === '20000-50000') score += 10;
    
    if (data.timeline === 'Immediate') score += 15;
    else if (data.timeline === '1-3 Months') score += 5;
    
    if (data.experience === 'Some' || data.experience === 'Extensive') score += 10;
    return Math.min(score, 100);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getColumnMapping() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let map = {};
    headers.forEach((h, i) => map[h] = i + 1);
    return map;
}

// -------------------------------------------------------------
// POST HANDLER (Writes & Updates)
// -------------------------------------------------------------

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Send OTP
    if (params.action === 'sendOTP') {
      const email = params.email;
      if (!email) throw new Error("Email is required");

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
      
      let otpSheet = ss.getSheetByName(OTP_SHEET);
      if (!otpSheet) { setup(); otpSheet = ss.getSheetByName(OTP_SHEET); }

      otpSheet.appendRow([new Date(), email, otp]);

      MailApp.sendEmail({
        to: email,
        subject: "Your KY Intermediater's Verification Code",
        htmlBody: `<div style="font-family: serif; color: #0f172a;">
            <h2>Verification Required</h2>
            <p>Your one-time password to access the KY Intermediater's application is:</p>
            <h1 style="color: #9c7b38; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
        </div>`
      });

      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Verify OTP
    if (params.action === 'verifyOTP') {
      const { email, otp } = params;
      const otpSheet = ss.getSheetByName(OTP_SHEET);
      if (!otpSheet) throw new Error("Server error: OTP Sheet not found");

      const data = otpSheet.getDataRange().getValues();
      let isValid = false;

      for (let i = data.length - 1; i > 0; i--) {
        const row = data[i];
        const rowTime = new Date(row[0]).getTime();
        const rowEmail = row[1];
        const rowOtp = row[2].toString();
        const isExpired = (new Date().getTime() - rowTime) > 600000;

        if (rowEmail === email) {
            if (rowOtp === otp && !isExpired) isValid = true;
            break;
        }
      }

      if (isValid) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid or expired OTP' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. Register Full Form
    if (params.action === 'register') {
      const data = params.data;
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) { setup(); sheet = ss.getSheetByName(SHEET_NAME); }
      
      const clientId = generateUUID();
      const score = calculateLeadScore(data);
      const initialLog = JSON.stringify([{ time: new Date().toISOString(), action: "Registered" }]);

      sheet.appendRow([
        new Date(), data.name, data.email, data.phone, data.interest,
        data.budget, data.location, data.occupation, data.experience,
        data.motivation, data.goal, data.timeline, data.time,
        data.venture_type, data.risk,
        "New Lead", "", score, "", "[]", initialLog, "Unassigned", clientId
      ]);

      try {
        MailApp.sendEmail({
            to: data.email,
            subject: "Application Received | KY Intermediater's",
            htmlBody: `<div style="font-family: serif; color: #0f172a;">
                <h2>Welcome to KY, ${data.name}.</h2>
                <p>We have successfully received your business profile and capital details.</p>
                <p>Our algorithm is currently pairing your profile with a dedicated business analyst. We will reach out within 48 hours to schedule your 1-on-1 strategy call.</p>
                <p>You can track your application status securely here: <a href="https://kyintermediaters.vercel.app/portal.html?id=${clientId}">Client Portal</a></p>
                <br>
                <p>Best Regards,</p>
                <p><strong>The KY Intelligence Team</strong></p>
            </div>`
        });
      } catch (e) { }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', clientId: clientId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Admin Auth Check for subsequent actions
    if (params.pass !== 'adminkypass' && params.action !== 'sendOTP' && params.action !== 'verifyOTP' && params.action !== 'register') {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Schedule Calendar Meeting
    if (params.action === "scheduleMeeting") {
      const { email, name, date, time } = params;
      if (!email || !date || !time) throw new Error("Email, Date, and Time are required.");

      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000));

      CalendarApp.getDefaultCalendar().createEvent(
        `Strategy Call: ${name} & KY Intelligence Team`,
        startTime,
        endTime,
        {
          guests: email,
          sendInvites: true,
          description: "Your 1-on-1 strategy call with the KY Intelligence Team to discuss your business profile and next steps."
        }
      );

      // Log activity
      updateLeadActivity(email, `Scheduled Meeting on ${date} at ${time}`);

      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Update Lead (CRM)
    if (params.action === 'updateLead') {
        const { email, field, value } = params;
        const sheet = ss.getSheetByName(SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const map = getColumnMapping();
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][2] === email) { // Col C is Email (index 2)
                const colIndex = map[field];
                if (!colIndex) throw new Error("Invalid field name: " + field);
                
                sheet.getRange(i + 1, colIndex).setValue(value);
                
                if (field === 'Status') {
                    updateLeadActivity(email, `Status changed to ${value}`);
                }
                
                return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
            }
        }
        throw new Error("Lead not found");
    }

    // 7. Bulk Action Broadcast Email
    if (params.action === 'bulkBroadcast') {
        const { emails, subject, body } = params;
        if (!emails || emails.length === 0) throw new Error("No emails selected");
        
        emails.forEach(email => {
            try {
                MailApp.sendEmail({ to: email, subject: subject, htmlBody: body });
                updateLeadActivity(email, `Sent broadcast: ${subject}`);
            } catch(e) {}
        });
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid POST action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateLeadActivity(email, logText) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const map = getColumnMapping();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][2] === email) {
            let logs = [];
            const logCol = map['ActivityLog'];
            try {
                const currentLogs = sheet.getRange(i + 1, logCol).getValue();
                logs = JSON.parse(currentLogs || "[]");
            } catch (e) { logs = []; }
            
            logs.push({ time: new Date().toISOString(), action: logText });
            sheet.getRange(i + 1, logCol).setValue(JSON.stringify(logs));
            return;
        }
    }
}

// -------------------------------------------------------------
// GET HANDLER (Reads)
// -------------------------------------------------------------

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (e.parameter.action === 'getRegistrations') {
      if (e.parameter.pass !== 'adminkypass') {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
      }
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
      
      const data = sheet.getDataRange().getValues();
      if (data.length > 0) data.shift(); // Remove header
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (e.parameter.action === 'getPortalData') {
      const clientId = e.parameter.id;
      if (!clientId) throw new Error("Missing ID");
      
      const data = sheet.getDataRange().getValues();
      const map = getColumnMapping();
      
      for (let i = 1; i < data.length; i++) {
          if (data[i][map['ClientID']-1] === clientId) {
              const status = data[i][map['Status']-1] || "Processing";
              const logs = JSON.parse(data[i][map['ActivityLog']-1] || "[]");
              const agent = data[i][map['Agent']-1] || "Unassigned";
              const docs = JSON.parse(data[i][map['Documents']-1] || "[]");
              return ContentService.createTextOutput(JSON.stringify({ 
                  status: 'success', 
                  data: { status, logs, agent, docs } 
              })).setMimeType(ContentService.MimeType.JSON);
          }
      }
      throw new Error("Invalid Link");
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid GET action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------
// CRON JOBS (Triggers)
// -------------------------------------------------------------

function checkReminders() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const map = getColumnMapping();
    
    const today = new Date().toISOString().split('T')[0];
    
    data.forEach((row, i) => {
        if (i === 0) return;
        const reminderDate = row[map['ReminderDate']-1];
        if (reminderDate && reminderDate.toString().startsWith(today)) {
            const email = row[2];
            const name = row[1];
            MailApp.sendEmail({
                to: "ky.intermediaters@gmail.com", // Admin Email
                subject: `CRM Reminder: Follow up with ${name}`,
                body: `You set a reminder to follow up with ${name} (${email}) today.`
            });
            // Clear reminder
            sheet.getRange(i + 1, map['ReminderDate']).setValue("");
        }
    });
}
```

## Step 4: Run the Setup Function
1. In the toolbar above the code, select the `setup` function from the dropdown.
2. Click the **Run** button.
3. Google will ask for permissions. Click **Review permissions**, choose your Google account, click **Advanced**, and then click **Go to Untitled project (unsafe)**. Finally, click **Allow**.
4. Check your Google Sheet; you should see new CRM columns added to the right side of the "Registrations" tab.

## Step 5: Setup Daily Reminders (Triggers)
1. On the left sidebar of Apps Script, click the **Triggers** icon (looks like an alarm clock).
2. Click **+ Add Trigger** in the bottom right.
3. Choose which function to run: `checkReminders`
4. Select event source: **Time-driven**
5. Select type of time based trigger: **Day timer**
6. Select time of day: **8am to 9am**
7. Click Save.

## Step 6: Deploy as Web App
1. In the top right corner, click **Deploy** > **New deployment**.
2. Select type: **Web app**.
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**.
6. **IMPORTANT:** Copy the new Web App URL and update it in `js/api.js`.
