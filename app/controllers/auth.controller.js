const userService = require('../services/User.service');

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

const login = async (req, res) => {
    try {
        const response = await userService.login(req.body)
        console.log("Response: ", response)

        if(response.error) {
            res.status(401).json({
                success: false,
                message: response.error,
                data: null
            })
        }

        else {
            res.status(201).json({
                success: true,
                message: 'Login successfully',
                data: response
            })
        }
        
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
            data: null
        })
    }
}

module.exports = {
    register,
    login,
}