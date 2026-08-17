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

// Run this function once manually to setup the headers
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Interest', 'Budget']);
    sheet.getRange("A1:F1").setFontWeight("bold");
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    
    if (params.action === 'register') {
      const data = params.data;
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_NAME);
      
      if (!sheet) {
        setup();
        sheet = ss.getSheetByName(SHEET_NAME);
      }
      
      sheet.appendRow([
        new Date(),
        data.name,
        data.email,
        data.phone,
        data.interest,
        data.budget
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
      
      if (data.length > 0) {
        // Remove header row
        data.shift();
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
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
