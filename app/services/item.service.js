const { pipeline } = require("nodemailer/lib/xoauth2/index.js");
const Item = require("../models/Item.model.js");
const ItemTypeModel = require("../models/ItemType.model.js");
const UnitItemModel = require("../models/UnitItem.model.js");
const { ObjectId } = require('mongodb');

const getAllItems = async ({
  page = 1,
  size = 10,
  search = '',
  itemTypeId = null,
  stock = null,
  isActive = null,
  itemCode = null,
  itemId = null,
  minPrice = null,
  maxPrice = null
}) => {
  try {
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.max(parseInt(size) || 10, 1);
    // Xử lý minPrice và maxPrice nếu có
    const minPriceNumber = minPrice !== null && minPrice !== undefined && minPrice !== '' ? parseInt(minPrice) : null;
    const maxPriceNumber = maxPrice !== null && maxPrice !== undefined && maxPrice !== '' ? parseInt(maxPrice) : null;

    const skip = (pageNumber - 1) * limitNumber;

    // Khởi tạo matchStage là một array để gom các điều kiện vào
    const matchConditions = [];

    // Xử lý điều kiện giá
    if (minPriceNumber !== null && maxPriceNumber !== null) {
      matchConditions.push({ "lastPrice.PRICE_AMOUNT": { $gte: minPriceNumber, $lte: maxPriceNumber } });
    } else if (minPriceNumber !== null) {
      matchConditions.push({ "lastPrice.PRICE_AMOUNT": { $gte: minPriceNumber } });
    } else if (maxPriceNumber !== null) {
      matchConditions.push({ "lastPrice.PRICE_AMOUNT": { $lte: maxPriceNumber } });
    }

    // Nếu có itemCode thì ưu tiên tìm theo itemCode, không kết hợp với điều kiện khác
    if (itemCode) {
      matchConditions.push({ ITEM_CODE: itemCode });
    } else {
      // Nếu không có itemCode, thêm các điều kiện khác

      if (itemId) {
        // Nếu itemId dạng string, ép kiểu ObjectId nếu cần
        matchConditions.push({ _id: new ObjectId(itemId) });
      }

      if (isActive !== null && isActive !== undefined && isActive !== '') {
        // isActive có thể là string "true"/"false" hoặc boolean
        const activeBool = (typeof isActive === 'string') ? (isActive.toLowerCase() === 'true') : Boolean(isActive);
        matchConditions.push({ IS_ACTIVE: activeBool });
      }

      if (itemTypeId) {
        // Kiểm tra tồn tại itemType trước khi thêm điều kiện
        const itemType = await ItemTypeModel.findOne({ _id: itemTypeId });
        if (!itemType) {
          return { error: "Item type not found" };
        }
        matchConditions.push({ ITEM_TYPE: itemType._id });
      }

      if (stock !== null && stock !== undefined && stock !== '') {
        const stockNumber = parseInt(stock);
        if (stockNumber === 0) {
          // Tồn kho = 0
          matchConditions.push({ "ITEM_STOCKS.QUANTITY": 0 });
        } else {
          // Tồn kho > 0
          matchConditions.push({ "ITEM_STOCKS.QUANTITY": { $gt: 0 } });
        }
      }

      if (search && search.trim() !== '') {
        // Nếu có từ khóa tìm kiếm thì thêm $or điều kiện tìm theo nhiều trường
        matchConditions.push({
          $or: [
            { ITEM_NAME: { $regex: search, $options: 'i' } },
            { ITEM_CODE: { $regex: search, $options: 'i' } },
            { ITEM_NAME_EN: { $regex: search, $options: 'i' } }
          ]
        });
      }
    }

    // Nếu không có điều kiện nào, match tất cả (match rỗng)
    const matchStage = matchConditions.length > 0 ? { $and: matchConditions } : {};

    // Pipeline aggregation
    const pipeline = [
      {
        $addFields: {
          lastPrice: { $arrayElemAt: ["$PRICE", -1] }
        }
      },
      { $match: matchStage },

      // Lookup UNIT (ngoài)
      {
        $lookup: {
          from: 'unit_items',
          localField: 'UNIT',
          foreignField: '_id',
          as: 'unit_info'
        }
      },
      { $unwind: { path: '$unit_info', preserveNullAndEmptyArrays: true } },

      // Lookup ITEM_TYPE (ngoài)
      {
        $lookup: {
          from: 'item_types',
          localField: 'ITEM_TYPE',
          foreignField: '_id',
          as: 'item_type_info'
        }
      },
      { $unwind: { path: '$item_type_info', preserveNullAndEmptyArrays: true } },

      // Unwind PRICE
      { $unwind: { path: '$PRICE', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'unit_invoices',
          localField: 'PRICE.UNIT',
          foreignField: '_id',
          as: 'price_unit_info'
        }
      },
      {
        $addFields: {
          'PRICE.UNIT_NAME': { $arrayElemAt: ['$price_unit_info.UNIT_NAME', 0] },
          'PRICE.UNIT_ABB': { $arrayElemAt: ['$price_unit_info.UNIT_ABB', 0] }
        }
      },

      // Group lại PRICE
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          PRICE: { $push: '$PRICE' }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$doc', { PRICE: '$PRICE' }]
          }
        }
      },

      // Unwind BOM_MATERIALS
      { $unwind: { path: '$BOM_MATERIALS', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'unit_items',
          localField: 'BOM_MATERIALS.UNIT',
          foreignField: '_id',
          as: 'bom_unit_info'
        }
      },
      {
        $addFields: {
          'BOM_MATERIALS.UNIT_NAME': { $arrayElemAt: ['$bom_unit_info.UNIT_ITEM_NAME', 0] },
          'BOM_MATERIALS.UNIT_ABB': { $arrayElemAt: ['$bom_unit_info.UNIT_ITEM_ABB', 0] }
        }
      },

      // Group lại BOM_MATERIALS
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          BOM_MATERIALS: { $push: '$BOM_MATERIALS' }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$doc', { BOM_MATERIALS: '$BOM_MATERIALS' }]
          }
        }
      },

      // Project các trường cần thiết
      {
        $project: {
          ITEM_NAME: 1,
          ITEM_CODE: 1,
          ITEM_NAME_EN: 1,
          ITEM_TYPE: 1,
          ITEM_STOCKS: 1,
          IS_ACTIVE: 1,
          UNIT: 1,
          ITEM_TYPE_NAME: '$item_type_info.ITEM_TYPE_NAME',
          UNIT_NAME: '$unit_info.UNIT_ITEM_NAME',
          PRICE: 1,
          BOM_MATERIALS: 1
        }
      },

      // Phân trang và tổng count
      {
        $facet: {
          paginatedResults: [
            { $sort: { ITEM_NAME: 1 } },
            { $skip: skip },
            { $limit: limitNumber }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Item.aggregate(pipeline);
    const items = result[0]?.paginatedResults || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return {
      total: totalCount,
      page: pageNumber,
      limit: limitNumber,
      items
    };
  } catch (error) {
    return { error: error.message };
  }
};


const getItemByCode = async (code) => {
    try{
        const item = await Item.findOne({ ITEM_CODE: code });
        if (!item) {
            return { error: "Item not found" };
        }
        return item;
    }catch (error) {
        return { error: error.message };
    }
};

const getItemById = async (id) => {
    try {
        const item = await Item.findById({_id: id});
        if (!item) {
            return { error: "Item not found!" };
        }
        return item;
    }
    catch (error) {
        return { error: error.message };
    }
};

const generateItemCode = async (itemType) => {
    try {
        const prefix = itemType.includes('Material') ? "NL" : "SP";
        const code = Math.floor(Math.random() * 1000000);
        return `${prefix}${code}`;
    } catch (error) {
        return { error: error.message };
    }
};

const createItem = async (itemData) => {
    const {
        itemName,
        itemType,
        itemNameEn,
        unitId,
        unitInvoiceId,
        price,
        description,
        isActive = true,
        userId,
        stock,
        avatarImageUrl,
        listImage,
        bomMaterials
    } = itemData;

    const BOM = await createBOMMaterials(bomMaterials);
    if(BOM.error!=null){
        return {error: error}
    }
    const existingUnit = await UnitItemModel.findOne({ _id: unitId });
    if (!existingUnit) {
        return { error: "Unit not found!" };
    }

    const existingItemType = await ItemTypeModel.findOne({ _id: itemType });
    if (!existingItemType) {
        return { error: "Item type not found" };
    }
    const newItemCode = await generateItemCode(existingItemType.ITEM_TYPE_NAME_EN);

    const existingItem = await Item.findOne({ ITEM_NAME: itemName });
    if (existingItem) {
        return { error: "Item already exists" };
    }

    const newItemData = {
        ITEM_CODE: newItemCode,
        ITEM_NAME: itemName,
        ITEM_NAME_EN: itemNameEn,
        ITEM_TYPE: existingItemType._id,
        AVATAR_IMAGE_URL: avatarImageUrl || null,
        UNIT: unitId,
        PRICE: [
            {
                PRICE_AMOUNT: Number(price) || 0,
                UNIT: unitInvoiceId,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        UPDATED_AT: new Date(),
        CREATED_AT: new Date(),
        DESCRIPTION: description,
        IS_ACTIVE: isActive,
        IMPORTED_BY: userId, //userId
        ITEM_STOCKS: {
            QUANTITY: stock || 0,
            LAST_UPDATED: new Date(),
        },
        LIST_IMAGE: listImage,
        BOM_MATERIALS: BOM || null
    };

    try {
        const newItem = await Item.create(newItemData);
        if (!newItem) {
            return {error: "Failed to create item"};
        }
        return newItem;
    } catch (error) {
        console.error("Lỗi khi tạo item:", error);
        return {error: "Error creating item"};
    }
};

const createBOMMaterials = async (BOMSData, itemId = null) => {
    const updatedBOMData = []; // Mảng để lưu các BOM mới
    for (const i of BOMSData) {
        const item = await Item.findOne({ ITEM_CODE: i.ITEM_CODE });
        if (item == null) return { error: "Nguyên liệu không tồn tại!" };
        if (Number(i.QUANTITY) <= 0) return { error: "Số lượng không phù hợp" };

        if (itemId != null) {
            const itemInBOM = await Item.findOne({ _id: itemId, "BOM_MATERIALS.ITEM_CODE": i.ITEM_CODE });
            if (itemInBOM) {
                // Nếu tồn tại, tăng số lượng
                await Item.updateOne(
                    { _id: itemId, "BOM_MATERIALS.ITEM_CODE": i.ITEM_CODE },
                    { $inc: { "BOM_MATERIALS.$.QUANTITY": Number(i.QUANTITY) } }
                );
                continue; // Bỏ item này ra khỏi danh sách mới thêm
            }
        }

        // Gán các giá trị bổ sung cho BOM mới
        i.UNIT = item.UNIT;
        i.FROM_DATE = new Date();
        i.THRU_DATE = new Date();
        updatedBOMData.push(i); // Thêm vào danh sách các BOM mới
    }

    return updatedBOMData; // Chỉ chứa BOM mới cần thêm
};


const updateItem = async (id, itemData) => {
    try {
        const fieldMap = {
            itemName: 'ITEM_NAME',
            itemNameEn: 'ITEM_NAME_EN',
            itemTypeId: 'ITEM_TYPE',
            unitId: 'UNIT',
            description: 'DESCRIPTION',
            avatarImageUrl: 'AVATAR_IMAGE_URL',
        };

        const updateData = {};

        for (const [inputKey, dbKey] of Object.entries(fieldMap)) {
            if (itemData[inputKey] !== undefined) {
                updateData[dbKey] = itemData[inputKey];
            }
        }

        updateData.UPDATED_AT = new Date();

        const updatedItem = await Item.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedItem) {
            return { error: "Item not found" };
        }

        return updatedItem;
    } catch (error) {
        return { error: "Error updating item" };
    }
};

const updateItemStock = async (id, quantity) => { // Chưa check
    try {
        const updatedItem = await Item.findByIdAndUpdate(id, 
            { 
                'ITEM_STOCKS.QUANTITY': quantity,
                'ITEM_STOCKS.LAST_UPDATED': new Date()
            }, 
            { new: true }
        );
        if (!updatedItem) {
            return {error: "Item not found!"};
        } 
        return updatedItem;
    } catch (error) {
        return {error: "Error updating item stock!"};
    }
};

const updateItemPrice = async (id, priceData) => { //Chưa check
    try {
        const updatedItem = await Item.findByIdAndUpdate(id,
            { 
                $push: {
                    PRICE: {
                        PRICE_AMOUNT: priceData,
                        FROM_DATE: new Date(),
                        THRU_DATE: null
                    }
                },
                UPDATED_AT: new Date()
            }, 
            { new: true }
        );
        if (!updatedItem) {
            return {error: "Item not found!"};
        }   
        return updatedItem;
    } catch (error) {
        return {error: "Error updating item price!"};
    }
};

const addBOMMaterialToItem = async (id, bomMaterials) => { //Chueac check
    try {
        console.log("bomMaterials:", bomMaterials);

        //Kiểm tra xem item có tồn tại không.
        const existingItem = await Item.findById(id);
        if (!existingItem) {
            return {error: "Item not found!"};
        }

        //Kiểm tra xem BomMaterials (Nguyên liệu) có tồn tại không.
        const BOM = await createBOMMaterials(bomMaterials, id); 
        console.log("BOM",BOM)
        if(BOM.error!=null){
            return {error: BOM.error}
        }
        const updatedItem = await Item.findByIdAndUpdate(id,
            { 
                $push: {
                    BOM_MATERIALS: {
                        $each: BOM
                    }
                },
                UPDATED_AT: new Date()
            }, 
            { new: true }
        );
        if (!updatedItem) {
            return {error: "Item not found!"};
        }
        return updatedItem;
    } catch (error) {
        return {error: "Error updating item BOM materials!"};
    }
};

//Chỉnh sửa số lượng của nguyên liệu trong BOM_MATERIALS
const updateBOMMaterialInItem = async (id, bomMaterials) => { //Check
    try {
        
        //Kiểm tra xem item có tồn tại không.
        const existingItem = await Item.findById(id);
        if (!existingItem) {
            return {error: "Item not found!"};
        }

        //kIỂM TRA xem item có tồn tại trong BOM_MATERIALS không.
        const existingItemInBOM = existingItem.BOM_MATERIALS.find(bom => bom.ITEM_CODE === bomMaterials.itemCode);
        if (!existingItemInBOM) {
            return {error: "Item not found in BOM Material!"};
        }

        const updatedItem = await Item.findOneAndUpdate(
            {
                _id: id,
                "BOM_MATERIALS.ITEM_CODE": bomMaterials.itemCode
            },
            {
                $set: {
                    "BOM_MATERIALS.$.QUANTITY": bomMaterials.quantity,
                    "BOM_MATERIALS.$.FROM_DATE": new Date(),
                }
            },
            { 
                UPDATED_AT: new Date()
            }, 
            { new: true }
        );
        if (!updatedItem) {
            return {error: "Item not found!"};
        }
        return updatedItem;
    } catch (error) {
        return {error: "Error updating item BOM materials!"};
    }
};

const removeBOMMaterialFromItem = async (id, itemCode) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            id,
            {
                $pull: {
                    BOM_MATERIALS: { ITEM_CODE: itemCode }
                },
                $set: { UPDATED_AT: new Date() }  // Đặt trong $set rõ ràng
            },
            { new: true }
        );

        if (!updatedItem) {
            return { error: "Item not found!" };
        }

        return updatedItem;
    } catch (error) {
        return { error: "Error deleting BOM material from item!", details: error.message };
    }
};

const deleteItem = async (id) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(id);
        if (!deletedItem) {
            return {error: "Item not found"};
        }
        return deletedItem;
    } catch (error) {
        return {error: "Error deleting item"};
    }
};

const getAllByItemTypeId = async (itemTypeId) => {
    try {
        const items = await Item.find({ ITEM_TYPE: itemTypeId });
        if (!items) {
            return { error: "Items not found" };
        }
        return items;
    } catch (error) {   
        return { error: "Error retrieving items" };
    }
};

const updateImagesForItem = async (id, images) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            id,
            { 
                LIST_IMAGE: images, 
                UPDATED_AT: new Date() 
            },
            { new: true }
        );
        if (!updatedItem) {
            return { error: "Item not found" };
        }
        return updatedItem;
    } catch (error) {
        return { error: "Error updating item images" };
    }
};

module.exports = {
    getAllItems,
    getItemByCode,
    getItemById,
    createItem,
    updateItem,
    getAllByItemTypeId,
    deleteItem,
    updateItemStock,
    updateItemPrice,
    addBOMMaterialToItem,
    updateBOMMaterialInItem,
    removeBOMMaterialFromItem,
    updateImagesForItem
};