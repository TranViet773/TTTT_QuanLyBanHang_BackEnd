const { authenticateToken, checkRoleMiddleware } = require('../../middlewares/auth.middleware');
function adminRoute(app) {
  app.use('/admin', authenticateToken, checkRoleMiddleware['admin']); 
}

module.exports = adminRoute;