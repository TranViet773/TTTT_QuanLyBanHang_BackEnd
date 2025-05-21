const adminRoute = require('./admin');
function routes(app) {
    adminRoute(app);

    //Xử lý các route không tồn tại
    // catch-all middleware hoặc fallback middleware
    app.use((req, res, next) => {
        return next();
    });
}