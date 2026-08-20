// ==========================================
// Google Apps Script API Configuration
// ==========================================

// IMPORTANT: Replace this with your actual Web App URL after deploying the Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxriQcZ4p_PPwFdYGHtnUcEoy5rHEeu6IEu92f79ihf4UwhBCQLX0hvpmI8OSoTlSo/exec";

/**
 * Submits registration data to Google Sheets
 * @param {Object} formData 
 */
async function submitRegistration(formData) {
    if (!GOOGLE_SCRIPT_URL) {
        throw new Error('Google Script URL not configured. Please set it up first.');
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                data: formData
            }),
            // mode: 'no-cors' is often required when posting to Google Apps Script 
            // unless you have properly set up CORS headers in your doPost return.
            // Using text/plain is a common workaround to avoid preflight options requests.
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            return true;
        } else {
            throw new Error(result.message || 'Failed to submit form');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
    }
}

/**
 * Fetches all registrations from Google Sheets for the Admin Dashboard
 */
async function fetchRegistrations(pass) {
    if (!GOOGLE_SCRIPT_URL) {
        throw new Error('Google Script URL not configured. Please set it up first.');
    }

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getRegistrations&pass=${encodeURIComponent(pass)}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

/**
 * Sends OTP to email
 * @param {string} email
 */
async function sendOTP(email) {
    if (!GOOGLE_SCRIPT_URL) throw new Error('Setup Google Script URL first.');
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'sendOTP', email: email }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

/**
 * Verifies OTP
 * @param {string} email
 * @param {string} otp
 */
async function verifyOTP(email, otp) {
    if (!GOOGLE_SCRIPT_URL) throw new Error('Setup Google Script URL first.');
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'verifyOTP', email: email, otp: otp }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

/**
 * Schedules a Google Calendar Meeting
 * @param {string} email
 * @param {string} name
 * @param {string} date
 * @param {string} time
 */
async function scheduleMeeting(email, name, date, time) {
    if (!GOOGLE_SCRIPT_URL) throw new Error("Setup Google Script URL first.");
    const pass = sessionStorage.getItem('ky_admin_auth') || 'adminkypass';
    const url = `${GOOGLE_SCRIPT_URL}?action=scheduleMeeting&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&pass=${encodeURIComponent(pass)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message);
    return true;
}

// Export a namespace for easier access
window.KYApi = {
    submitRegistration,
    fetchRegistrations,
    getRegistrations: fetchRegistrations, // alias for backwards compatibility with admin.html
    sendOTP,
    verifyOTP,
    scheduleMeeting
};

/**
 * Updates a specific field for a lead in the CRM
 */
async function updateLead(email, field, value, pass) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "") throw new Error("API not configured.");
    
    const url = `${GOOGLE_SCRIPT_URL}?action=updateLead&email=${encodeURIComponent(email)}&field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}&pass=${encodeURIComponent(pass)}`;
    const response = await fetch(url);
    
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message);
    return true;
}

/**
 * Sends a mass broadcast email to selected leads
 */
async function bulkBroadcast(emails, subject, body, pass) {
    if (!GOOGLE_SCRIPT_URL) throw new Error("API not configured.");
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "bulkBroadcast", emails, subject, body, pass }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message);
    return true;
}

/**
 * Fetches status tracker data for the Client Portal
 */
async function fetchPortalData(clientId) {
    if (!GOOGLE_SCRIPT_URL) throw new Error("API not configured.");
    
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPortalData&id=${encodeURIComponent(clientId)}`);
    const result = await response.json();
    
    if (result.status !== "success") throw new Error(result.message);
    return result.data;
}

// Re-export new functions
Object.assign(window.KYApi, { updateLead, bulkBroadcast, fetchPortalData });
