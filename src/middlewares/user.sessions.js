const { v4: uuidv4 } = require("uuid");

const validateSession = async (req, res, next) => {
    if (!req.session.user_uuid) {
        req.session.user_uuid = uuidv4();
        req.session.user_mmr = 0;
    }

    next();
};

module.exports = { validateSession }