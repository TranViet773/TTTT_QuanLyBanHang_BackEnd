const cartService = require('../services/cart.service'); 
const addItemToCart = async (req, res) => {
    try{
        const {quantity, itemCode} = req.body;
        //console.log({session, quantity, itemCode});
        const response = await cartService.addItemToCart(req.session, itemCode, quantity);
        if(response.error)
            return res.status(404).json({
                success: false,
                message: response.error,
                data: null
             });
        res.status(200).json({
            success: true,
            message: "Đã thêm sản phẩm vào giỏ hàng!",
            data: response
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: "Có lỗi khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!",
            data: error.message
        });
    }
};

const getCartByUser = async (req, res) => {
    let response = await cartService.getCartByUser(req.session);
    console.log(response);
    if(!response)
        response = null
    res.status(200).json({
            success: true,
            message: "Lấy thông tin giỏ hàng thành công!",
            data: response
        });
}

const removeItemFromCart = async (req, res) => {
    try{
        const {itemCode} = req.body;
        console.log({itemCode});
        const response = await cartService.removeItemFromCart(req.session, itemCode);
        if(response?.error)
            return res.status(404).json({
                success: false,
                message: response?.error,
                data: null
             });
        res.status(200).json({
            success: true,
            message: "Đã xóa sản phẩm khỏi giỏ hàng!",
            data: response
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: "Có lỗi khi xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại!",
            data: e.message
        });
    }
};

const removeItemsFromCart = async (req, res) => {
    try{
        const {itemsCode} = req.body;
        console.log({itemsCode});
        const response = await cartService.removeItemsFromCart(req.session, itemsCode);
        if(response?.error)
            return res.status(404).json({
                success: false,
                message: response?.error,
                data: null
             });
        res.status(200).json({
            success: true,
            message: "Đã xóa sản phẩm khỏi giỏ hàng!",
            data: response
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: "Có lỗi khi xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại!",
            data: e.message
        });
    }
};

const updateQuantityItemInCart = async (req, res) => {
    try{
        const {quantity, itemCode, increase, decrease} = req.body;
        console.log({quantity, itemCode, increase, decrease});
        const response = await cartService.updateQuantityItemInCart(req.session, itemCode, quantity, increase, decrease);
        console.log(response)
        if(response?.error)
            return res.status(404).json({
                success: false,
                message: response?.error,
                data: null
             });
        res.status(200).json({
            success: true,
            message: "Đã cập nhật số lượng sản phẩm trong giỏ hàng!",
            data: response
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: "Có lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng. Vui lòng thử lại!",
            data: error.message
        });
    }
};


module.exports = {  
    addItemToCart,
    getCartByUser,
    removeItemFromCart,
    updateQuantityItemInCart,
    removeItemsFromCart
}