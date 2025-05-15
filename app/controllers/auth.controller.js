const userService = require('../services/user.service');

const register = async (req, res) => {
    try{
        //const { username, password } = req.body;
        const user = await userService.register(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            user,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error registering user',
            error: error.message,
        });
    }
}

module.exports = {
    register
}