// ==========================================
// KY Intermediaters API Configuration
// ==========================================

async function submitRegistration(formData) {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', data: formData })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to register');
    return true;
}

async function fetchRegistrations(pass) {
    const response = await fetch(`/api/admin?action=getRegistrations&pass=${encodeURIComponent(pass)}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to fetch data');
    return result.data;
}

async function sendOTP(email) {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendOTP', email: email })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

async function verifyOTP(email, otp) {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verifyOTP', email: email, otp: otp })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

async function scheduleMeeting(email, name, date, time) {
    const pass = sessionStorage.getItem('ky_admin_auth') || 'adminkypass';
    const response = await fetch(`/api/calendar?action=scheduleMeeting&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&pass=${encodeURIComponent(pass)}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

async function updateLead(email, field, value, pass) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateLead', email, field, value, pass })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

async function bulkBroadcast(emails, subject, body, pass) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulkBroadcast', emails, subject, body, pass })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

async function fetchPortalData(clientId) {
    const response = await fetch(`/api/portal?action=getPortalData&id=${encodeURIComponent(clientId)}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return result.data;
}

window.KYApi = {
    submitRegistration,
    fetchRegistrations,
    getRegistrations: fetchRegistrations,
    sendOTP,
    verifyOTP,
    scheduleMeeting,
    updateLead,
    bulkBroadcast,
    fetchPortalData
};
