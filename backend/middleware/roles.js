// 🔥 FIXED: Bug in role checking logic (was roles.user instead of !roles.length)
module.exports = function(...roles) {
    return (req, res, next) => {
        if (!roles.length || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied, You do not have access...!' });
        }
        next();
    };
}

