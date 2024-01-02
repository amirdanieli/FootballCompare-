module.exports = (req, res, next) => {
    if (!req.session.user_id) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/pages/login');
    }
    next();
}
