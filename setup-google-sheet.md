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

// Run this function once manually to setup the headers
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Interest', 'Capital', 'Location', 'Occupation', 'Experience', 'Motivation', 'Goal', 'Timeline', 'Time Comm.', 'Venture Type', 'Risk']);
    sheet.getRange("A1:O1").setFontWeight("bold");
  }

  let otpSheet = ss.getSheetByName(OTP_SHEET);
  if (!otpSheet) {
    otpSheet = ss.insertSheet(OTP_SHEET);
    otpSheet.appendRow(['Timestamp', 'Email', 'OTP']);
    otpSheet.hideSheet(); // Hide it so it doesn't clutter the UI
  }
}

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

      // Save OTP to cache
      otpSheet.appendRow([new Date(), email, otp]);

      // Send Email
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

      // Check from bottom to top for latest OTP
      for (let i = data.length - 1; i > 0; i--) {
        const row = data[i];
        const rowTime = new Date(row[0]).getTime();
        const rowEmail = row[1];
        const rowOtp = row[2].toString();

        // Expire after 10 mins (600,000 ms)
        const isExpired = (new Date().getTime() - rowTime) > 600000;

        if (rowEmail === email) {
            if (rowOtp === otp && !isExpired) {
                isValid = true;
            }
            break; // Found the latest one, no need to check older ones
        }
      }

      if (isValid) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid or expired OTP' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. Register Full Form
    if (params.action === 'register') {
      const data = params.data;
      let sheet = ss.getSheetByName(SHEET_NAME);
      
      if (!sheet) { setup(); sheet = ss.getSheetByName(SHEET_NAME); }
      
      // Append row to sheet
      sheet.appendRow([
        new Date(), data.name, data.email, data.phone, data.interest,
        data.budget, data.location, data.occupation, data.experience,
        data.motivation, data.goal, data.timeline, data.time,
        data.venture_type, data.risk
      ]);

      // Send Confirmation Email automatically
      try {
        // Email to Client
        MailApp.sendEmail({
            to: data.email,
            subject: "Application Received | KY Intermediater's",
            htmlBody: `<div style="font-family: serif; color: #0f172a;">
                <h2>Welcome to KY, ${data.name}.</h2>
                <p>We have successfully received your business profile and capital details.</p>
                <p>Our algorithm is currently pairing your profile with a dedicated business analyst. We will reach out within 48 hours to schedule your 1-on-1 strategy call.</p>
                <br>
                <p>Best Regards,</p>
                <p><strong>The KY Intelligence Team</strong></p>
            </div>`
        });

        // Email to Admin
        const adminEmail = "ky.intermediaters@gmail.com";
        const adminHtmlBody = `<div style="font-family: sans-serif; color: #333;">
            <h2>New Registration: ${data.name}</h2>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Interest:</strong> ${data.interest}</p>
            <p><strong>Capital:</strong> ${data.budget}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p><strong>Occupation:</strong> ${data.occupation}</p>
            <p><strong>Experience:</strong> ${data.experience}</p>
            <p><strong>Motivation:</strong> ${data.motivation}</p>
            <p><strong>Goal:</strong> ${data.goal}</p>
            <p><strong>Timeline:</strong> ${data.timeline}</p>
            <p><strong>Time Comm.:</strong> ${data.time}</p>
            <p><strong>Venture Type:</strong> ${data.venture_type}</p>
            <p><strong>Risk Tolerance:</strong> ${data.risk}</p>
            <hr>
            <p><a href="https://ky-intermediaters.vercel.app/admin.html">Login to Admin Dashboard</a></p>
        </div>`;
        
        MailApp.sendEmail({
            to: adminEmail,
            subject: `New Lead: ${data.name} - ${data.budget}`,
            htmlBody: adminHtmlBody
        });

      } catch (e) {
          // Ignore email failure so the registration still succeeds
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Schedule Calendar Meeting
    if (params.action === "scheduleMeeting") {
      const { email, name, date, time } = params;
      if (!email || !date || !time) throw new Error("Email, Date, and Time are required.");

      // Combine date and time
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hour meeting

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

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid POST action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === 'getRegistrations') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);
      
      if (!sheet) {
         return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      if (data.length > 0) data.shift(); // Remove header row
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid GET action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 4: Run the Setup Function
1. In the toolbar above the code, select the `setup` function from the dropdown.
2. Click the **Run** button.
3. Google will ask for permissions. Click **Review permissions**, choose your Google account, click **Advanced**, and then click **Go to Untitled project (unsafe)**. Finally, click **Allow**.
4. Check your Google Sheet; you should see a new tab called "Registrations" with bolded column headers.

## Step 5: Deploy as Web App
1. In the top right corner of the Apps Script editor, click the **Deploy** button.
2. Select **New deployment**.
3. Click the gear icon next to "Select type" and choose **Web app**.
4. Fill in the details:
   - **Description**: KY API
   - **Execute as**: Me (your email)
   - **Who has access**: **Anyone** *(This is required so the public form can submit data)*
5. Click **Deploy**.
6. Copy the **Web app URL** that is generated.

## Step 6: Connect to the Frontend
1. Open the file `js/api.js` in your project.
2. Find line 5:
   `const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE';`
3. Replace `'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE'` with the Web App URL you just copied. Keep it inside the quotes.

Done! Your website is now fully connected to your Google Sheet database.
