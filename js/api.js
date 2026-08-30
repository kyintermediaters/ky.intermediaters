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

async function signNDA(clientId) {
    const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signNDA', id: clientId })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}

window.KYApi.signNDA = signNDA;

async function uploadDocument(clientId, fileName, fileData) {
    const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'uploadDoc', id: clientId, fileName, fileData })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return result.url;
}
window.KYApi.uploadDocument = uploadDocument;

async function requestIntro(clientId, dealTitle) {
    const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'requestIntro', id: clientId, dealTitle })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}
window.KYApi.requestIntro = requestIntro;

async function getDeals(pass) {
    const response = await fetch(`/api/admin?action=getDeals&pass=${encodeURIComponent(pass)}`);
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return result.data;
}
window.KYApi.getDeals = getDeals;

async function createDeal(pass, dealData) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createDeal', pass, ...dealData })
    });
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);
    return true;
}
window.KYApi.createDeal = createDeal;
