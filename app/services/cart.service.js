const ItemModel = require("../models/Item.model");
const UserModel = require("../models/User.model");
const itemHelper = require('../helpers/item.helper');

const addItemToCart = async (session, itemCode, quantity) =>{
    try{
        //itemData = {ITEM_CODE, ITEM_NAME, ITEM_AVATAR, ITEM_PRICE, ITEM_UNIT, QUATITY}
        if (!session.cart) session.cart = {
            items: [],
            // length: items.length,
            UPDATE_AT: new Date(),
            CREATE_AT: new Date()
        };
        const existingItem = await ItemModel.findOne({ITEM_CODE: itemCode});
        if(!existingItem)
            return {error: "Sản phẩm không tồn tại!"};
        
        if(quantity > existingItem.ITEM_STOCKS.QUANTITY)
            return {error: "Số lượng vượt quá số lượng tồn kho!"};

        const validPrice = itemHelper.isValidPrice(existingItem.PRICE);
        const itemData = {
            ITEM_CODE: existingItem.ITEM_CODE,
            ITEM_NAME: existingItem.ITEM_NAME,
            ITEM_AVATAR: existingItem.AVATAR_IMAGE_URL,
            ITEM_PRICE: validPrice.PRICE_AMOUNT,
            ITEM_UNIT: existingItem.UNIT
        }
        const index = session.cart.items.findIndex(item => item.ITEM_CODE == itemCode);
        if(index !== -1){
            const totalQuantity = session.cart.items[index].QUANTITY + quantity;
            if(totalQuantity > existingItem.ITEM_STOCKS.QUANTITY)
                return {error: "Số lượng thêm vào và số lượng có trong giỏ hàng vượt quá số lượng tồn kho!"};
            else{
                session.cart.items[index].QUANTITY += quantity;
                session.cart.items[index].UPDATE_AT = new Date();
                session.cart.UPDATE_AT = new Date();
                return session.cart;
            }
        }else{
            itemData.UPDATE_AT = new Date();
            itemData.QUANTITY = quantity;
            session.cart.items.push(itemData);
            session.cart.UPDATE_AT = new Date();
            session.cart.length = session.cart.items.length;
            return session.cart;
        }
    }catch(e){
        console.log(e);
        return {error: "Có lỗi khi thêm vào giỏ hàng. Vui lòng thử lại!"};
    }
};

const removeItemFromCart = async (session, itemCode) => {
    try{
        //itemData = {ITEM_CODE, ITEM_NAME, ITEM_AVATAR, ITEM_PRICE, ITEM_UNIT, QUATITY}
        if (!session.cart) session.cart = {
            items: [],
            UPDATE_AT: new Date(),
            CREATE_AT: new Date()
        };
        const existingItem = await ItemModel.findOne({ITEM_CODE: itemCode});
        if(!existingItem)
            return {error: "Sản phẩm không tồn tại!"};

        const index = session.cart.items.findIndex(item => item.ITEM_CODE == itemCode);
        if(index == -1)
            return {error: "Sản phẩm không có trong giỏ hàng!"}

        session.cart.items.splice(index, 1);
        session.cart.UPDATE_AT = new Date();
        session.cart.length = session.cart.items.length;
        return session.cart; 

    }catch(e)
    {
        console.log(e);
        return {error: "Có lỗi khi xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại!"}
    }
}

const updateQuantityItemInCart = async (session, itemCode, quantity = null, increase = false, decrease = false ) => {
    try{
        const existingItem = await ItemModel.findOne({ITEM_CODE: itemCode});
        if(!existingItem)
            return {error: "Sản phẩm không tồn tại!"};

        const index = session.cart.items.findIndex(item => item.ITEM_CODE == itemCode);
        if(index !== -1){

            if(increase == true){
                if(session.cart.items[index].QUANTITY == existingItem.ITEM_STOCKS.QUANTITY)
                    return {error: "Vượt quá số lượng tồn kho!"};

                session.cart.items[index].QUANTITY +=1;
                session.cart.items[index].UPDATE_AT = new Date(); 
                session.cart.UPDATE_AT = new Date();
                return session.cart.items[index];
            }

            if(decrease){
                if(session.cart.items[index].QUANTITY == 1)
                    return {error: "Số lượng phải lớn hơn 0!"};

                session.cart.items[index].QUANTITY -=1;
                session.cart.items[index].UPDATE_AT = new Date(); 
                session.cart.UPDATE_AT = new Date();
                return session.cart.items[index]
            }

            if(quantity && quantity <= 0)
                return {error: "Số lượng phải lớn hơn 0!"}
            else if(quantity && quantity > existingItem.ITEM_STOCKS.QUANTITY)
                    return {error: "Số lượng vượt quá số lượng tồn kho!"}
                else{ // Cập nhật số lượng quantity
                    session.cart.items[index].QUANTITY = quantity;
                    session.cart.items[index].UPDATE_AT = new Date(); 
                    session.cart.UPDATE_AT = new Date();
                    return session.cart.items[index];
                }
        }else{
            return {error: "Sản phẩm không tồn tại trong giỏ hàng!"}
        }
    }catch(e){
        console.log(e);
        return {error: "Có lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng!"}
    }
}

const getCartByUser = async (session) => {
    if (!session.cart) session.cart = {
        items: [],
        // length: items.length,
        UPDATE_AT: new Date(),
        CREATE_AT: new Date()
    };
    session.cart.length = session.cart.items.length;
    return session.cart;
}

//Xóa tất cả sản phẩm trong giỏ hàng.
const removeItemsFromCart = async (session, itemsCode) => {
    try{
        //itemData = {ITEM_CODE, ITEM_NAME, ITEM_AVATAR, ITEM_PRICE, ITEM_UNIT, QUATITY}
        for (const itemCode of itemsCode) {
            if (!session.cart) session.cart = {
                items: [],
                UPDATE_AT: new Date(),
                CREATE_AT: new Date()
            };
            const existingItem = await ItemModel.findOne({ITEM_CODE: itemCode});
            if(!existingItem)
            {
                console.log(`Sản phẩm có itemCode: ${itemCode} không còn tồn tại!`);
                continue;
            }

            const index = session.cart.items.findIndex(item => item.ITEM_CODE == itemCode);
            if(index == -1)
            {
                console.log(`Sản phẩm có itemCode: ${itemCode} không tồn tại trong giỏ hàng!`);
                continue;
            }
            session.cart.items.splice(index, 1);
        }
        
        session.cart.UPDATE_AT = new Date();
        session.cart.length = session.cart.items.length;
        return session.cart;
    }catch(e)
    {
        console.log(e);
        return {error: "Có lỗi khi xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại!"}
    }
}

//note lại khi thêm vào giỏ hàng, mà sản phẩm đó lỡ hết hàng thì cần cập nhật sau.
module.exports = {
    getCartByUser,
    addItemToCart,
    removeItemFromCart,
    updateQuantityItemInCart,
    removeItemsFromCart
}