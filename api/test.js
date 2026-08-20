module.exports = function (req, res) {
    try {
        if (typeof res.status === 'function') {
            res.status(200).json({ status: 'success', message: 'Vercel API works', env: process.env.MONGODB_URI ? 'Set' : 'Missing' });
        } else {
            res.end(JSON.stringify({ status: 'error', message: 'res.status is not a function' }));
        }
    } catch (e) {
        res.end('Crash: ' + e.message);
    }
};
