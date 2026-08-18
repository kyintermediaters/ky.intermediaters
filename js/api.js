// ==========================================
// Google Apps Script API Configuration
// ==========================================

// IMPORTANT: Replace this with your actual Web App URL after deploying the Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_CaaNC0lOnzgJz76vMJkwLC2mfcDTo4zaw0eyfMMY8KuQF3SSfhi0Mr_A_OJmSRms/exec';

/**
 * Submits registration data to Google Sheets
 * @param {Object} formData 
 */
async function submitRegistration(formData) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE') {
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
async function fetchRegistrations() {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE') {
        throw new Error('Google Script URL not configured. Please set it up first.');
    }

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getRegistrations`);
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
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE') throw new Error('Setup Google Script URL first.');
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
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE') throw new Error('Setup Google Script URL first.');
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'verifyOTP', email: email, otp: otp }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

// Export a namespace for easier access
window.KYApi = {
    submitRegistration,
    fetchRegistrations,
    getRegistrations: fetchRegistrations, // alias for backwards compatibility with admin.html
    sendOTP,
    verifyOTP
};
