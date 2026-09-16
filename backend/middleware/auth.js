async function authMiddleware(req, res, next) {
  req.user = { id: "anonymous" };
  next();
}

module.exports = authMiddleware;
