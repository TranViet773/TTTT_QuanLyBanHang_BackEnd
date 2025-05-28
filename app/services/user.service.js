const User = require("../models/User.model");
const Account = require("../models/Account.model");
const AccountDevice = require("../models/AccountDevice.model");
const authService = require("../services/auth.service");
const authHelper = require("../helpers/auth.helper");
const { isValidInfo } = require("../helpers/auth.helper");

const { generateKeyPairSync } = require("crypto");
const ms = require("ms");
const { addTokenToBlacklist } = require("../utils/tokenBlacklist");

// tạo cặp khóa RSA cho từng thiết bị đăng nhập
const generateKeyPair = () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });
  return { privateKey, publicKey };
};

const handleUserDataForResponse = (user, account, device) => {
  // Lấy dữ liệu cho token
  const verifyData = {
    USER_ID: user._id,
    USERNAME: account.USERNAME,
    FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].FIRST_NAME,
    LAST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].LAST_NAME,
    EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length - 1].EMAIL,
    DEVICE_ID: device.ID_DEVICE || null,
    DEVICE_NAME: device.NAME_DEVICE || "",
    IS_ADMIN: user.ROLE.IS_ADMIN,
    IS_MANAGER: user.ROLE.IS_MANAGER,
    IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
    IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
    IS_ACTIVE: account.IS_ACTIVE,
    AVATAR: user.AVATAR_IMG_URL,
    DEVICE_ID: device.ID_DEVICE || null,
  };

  const accessToken = authService.generateAccessToken(
    verifyData,
    device.PRIVATE_KEY
  );
  const refreshToken = authService.generateRefreshToken(
    verifyData,
    device.PRIVATE_KEY
  );

  const email = authHelper.isValidInfo(user.LIST_EMAIL);
  const name = authHelper.isValidInfo(user.LIST_NAME);
  const address = authHelper.isValidInfo(user.LIST_ADDRESS);
  const phoneNumber = authHelper.isValidInfo(user.LIST_PHONE_NUMBER);
  const now = new Date();
  return {
    accessToken,
    refreshToken,
    user_data: {
      USER_ID: user._id,
      USERNAME: account.USERNAME,
      NAME: {
        LAST_NAME: name.LAST_NAME,
        FIRST_NAME: name.FIRST_NAME,
        MIDDLE_NAME: name.MIDDLE_NAME,
        FULL_NAME: name.FULL_NAME,
      },
      CURRENT_GENDER: user.CURRENT_GENDER,
      BIRTH_DATE: user.BIRTH_DATE,
      AVATAR_IMG_URL: user.AVATAR_IMG_URL,
      ADDRESS: {
        COUNTRY: address?.COUNTRY,
        CITY: address?.CITY,
        DISTRICT: address?.DISTRICT,
        WARD: address?.WARD,
        ADDRESS_1: address?.ADDRESS_1,
        ADDRESS_2: address?.ADDRESS_2,
        STATE: address?.STATE,
      },
      ROLE: {
        IS_ADMIN: user.ROLE.IS_ADMIN,
        IS_MANAGER: user.ROLE.IS_MANAGER,
        IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
        IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
        IS_ACTIVE: account.IS_ACTIVE,
      },
      EMAIL: email.EMAIL,
      PHONE_NUMBER: {
        COUNTRY_CODE: phoneNumber?.COUNTRY_CODE,
        COUNTRY_NAME: phoneNumber?.COUNTRY_NAME,
        AREA_CODE: phoneNumber?.AREA_CODE,
        PHONE_NUMBER: phoneNumber?.PHONE_NUMBER,
        FULL_PHONE_NUMBER: phoneNumber?.FULL_PHONE_NUMBER,
      },
      ACCOUNT_DEVICE: {
        DEVICE_ID: device.ID_DEVICE,
        DEVICE_NAME: device.NAME_DEVICE || "",
        LAST_TIME_LOGIN: device.LAST_TIME_LOGIN,
      },
      ACCESS_TOKEN_EXPIRY: new Date(
        Date.now() + ms(process.env.ACCESS_TOKEN_EXPIRY)
      ).toISOString(),
      REFRESH_TOKEN_EXPIRY: new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY)
      ).toISOString(),
    },
  };
};

const handleRegistration = async (data) => {
  const existingUser =
    (await User.findOne({ EMAIL: data.email })) ||
    (await Account.findOne({ USERNAME: data.username }));
  if (existingUser) return { error: "Email đã được đăng ký!" };
  await authService.sendVerificationEmail(data);
};

const handleCreateUser = async (data) => {
  const {
    username,
    password,
    gender,
    avatar,
    email,
    dob,
    lastName,
    middleName,
    firstName,
    country,
    city,
    district,
    ward,
    address1,
    address2,
    state,
    countryCode,
    countryName,
    areaCode,
    phoneNumber,
    fullPhoneNumber,
    relationship,
    isManager,
    isServiceStaff,
    createByUserId,
  } = data;

  console.log(data);

  let role = {};

  if (isManager || isServiceStaff) {
    role = {
      IS_ADMIN: false,
      IS_MANAGER: isManager,
      IS_SERVICE_STAFF: isServiceStaff,
      IS_CUSTOMER: false,
    };
  } else {
    role = {
      IS_ADMIN: false,
      IS_MANAGER: false,
      IS_SERVICE_STAFF: false,
      IS_CUSTOMER: true,
    };
  }

    const userData = {
        LIST_NAME: [
            {
                LAST_NAME: lastName,
                FIRST_NAME: firstName,
                MIDDLE_NAME: middleName,
                FULL_NAME: `${lastName} ${firstName}`,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        CURRENT_GENDER: gender, // 'Nam', 'Nữ', 'Khác'
        BIRTH_DATE: dob === null ? null : new Date(dob),
        AVATAR_IMG_URL: avatar || '',
        ROLE: role,
        LIST_EMAIL: [
            {
                EMAIL: email,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        LIST_ADDRESS: [
            {   
                COUNTRY: country,
                CITY: city,
                DISTRICT: district,
                WARD: ward,
                ADDRESS_1: address1,
                ADDRESS_2: address2,
                STATE: state,
                FROM_DATE: new Date(),
                THRU_DATE: null
            }
        ],
        LIST_PHONE_NUMBER: [
            {
                COUNTRY_CODE: countryCode,
                COUNTRY_NAME: countryName,
                AREA_CODE: areaCode,
                PHONE_NUMBER: phoneNumber,
                FULL_PHONE_NUMBER: fullPhoneNumber,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        LIST_CONTACT: [
            {
                LAST_NAME: lastName,
                FIRST_NAME: firstName,
                MIDDLE_NAME: middleName,
                FULL_NAME: `${lastName} ${firstName}`,
                PHONE_NUMBER: fullPhoneNumber,
                ADDRESS_1: address1,
                ADDRESS_2: address2,
                EMAIL: email,
                WARD: ward,
                DISTRICT: district,
                CITY: city,
                STATE: state,
                COUNTRY: country,
                RELATIONSHIP: relationship,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ]
    };



  let user = new User();
  try {
    //Tạo một đối tượng user
    user = await User.create(userData);
    // console.log(user);

    //Tạo đối tượng Account
    const accountData = {
      USERNAME: username,
      PASSWORD: await authService.hashPassword(password),
      CREATE_BY_USER_ID: createByUserId,
      FROM_DATE: new Date(),
      THRU_DATE: null,
      USER_ID: user._id,
    };

    const account = await Account.create(accountData);

    // Tạo đối tượng account device
    const accountDeviceData = {
      USER_ID: user._id,
    };

    const accountDevice = await AccountDevice.create(accountDeviceData);

    if (createByUserId) {
      return {
        username: username,
        password: password,
        email: email,
      };
    }

    // return handleUserDataForResponse(user, account, accountDevice)
  } catch (error) {
    //Rollback khi có lỗi
    const userExisted = await User.findOne({ _id: user._id });
    if (userExisted) {
      await User.deleteOne({ _id: user._id });
    }

    const accountExisted = await Account.findOne({ USER_ID: user._id });
    if (accountExisted) {
      await Account.deleteOne({ USER_ID: user._id });
    }

    const accountDeviceExisted = await AccountDevice.findOne({
      USER_ID: user._id,
    });
    if (accountDeviceExisted) {
      await AccountDevice.deleteOne({ USER_ID: user._id });
    }

    console.error("Error creating user:", error);
    return { error: "Lỗi khi tạo tài khoản" };
  }
};

// Kiểm tra thiết bị đăng nhập
const loginDevice = async (
  accountDevice,
  deviceId = null,
  deviceName,
  deviceType
) => {
  // Kiểm tra thiết bị đăng nhập
  if (accountDevice.LIST_DEVICE_OF_ACCOUNT.length > 0) {
    for (let i = 0; i <= accountDevice.LIST_DEVICE_OF_ACCOUNT.length - 1; i++) {
      // Nếu thiết bị đã được lưu
      if (accountDevice.LIST_DEVICE_OF_ACCOUNT[i].ID_DEVICE === deviceId) {
        accountDevice.LIST_DEVICE_OF_ACCOUNT[i].LAST_TIME_LOGIN = new Date();

        try {
          await accountDevice.save();
        } catch (error) {
          throw new Error("Lỗi khi cập nhật last time login.");
        }

        return accountDevice.LIST_DEVICE_OF_ACCOUNT[i];
      }
    }
  }

  // Nếu là thiết bị mới
  const { privateKey, publicKey } = generateKeyPair();
  const newDevice = {
    ID_DEVICE: deviceId || null,
    NAME_DEVICE: deviceName || null,
    TYPE_DEVICE: deviceType || null,
    LAST_TIME_LOGIN: new Date(),
    PRIVATE_KEY: privateKey,
    PUBLIC_KEY: publicKey,
  };
  accountDevice.LIST_DEVICE_OF_ACCOUNT.push(newDevice);

  try {
    await accountDevice.save();
  } catch (error) {
    throw new Error("Lỗi khi lưu thiết bị mới");
  }

  return newDevice;
};

const login = async (data) => {
  const { username, email, password, deviceId, deviceName, deviceType } = data;

  if ((!username || !email) && !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin đăng nhập." };
  }

  if (email) {
    const user = await User.findOne({ "LIST_EMAIL.EMAIL": email });

    // Nếu user đăng nhập bằng email
    if (user) {
      if (!authHelper.isValidEmail(user, email)) {
        return {
          error:
            "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký.",
        };
      }

      // Lấy account theo user id
      const account = await Account.findOne({ USER_ID: user._id });
      if (!account) {
        throw new Error("Lỗi xảy ra khi truy xuất tài khoản.");
      }

      if (account.IS_ACTIVE === false) {
        return { error: "Tài khoản đã dừng hoạt động." };
      }

      if (account.IS_SUSPENDED === true) {
        return { error: "Tài khoản bị tạm khóa." };
      }

      // So sánh password
      if (!(await authService.isMatchedPassword(password, account.PASSWORD))) {
        return { error: "Sai mật khẩu." };
      }

      const accountDevice = await AccountDevice.findOne({ USER_ID: user._id });

      if (!accountDevice) {
        throw new Error("Lỗi xảy ra khi truy xuất tài khoản.");
      }

      const device = await loginDevice(
        accountDevice,
        deviceId,
        deviceName,
        deviceType
      );

      const response = handleUserDataForResponse(user, account, device);

      return response;
    } else {
      return { error: "Email chưa được đăng ký." };
    }
  }

  // Đăng nhập bằng username
  else {
    const account = await Account.findOne({ USERNAME: username });
    if (!account) {
      return { error: "Tài khoản không tồn tại." };
    } else {
      if (account.IS_ACTIVE === false) {
        return { error: "Tài khoản đã dừng hoạt động." };
      }

      if (account.IS_SUSPENDED === true) {
        return { error: "Tài khoản bị tạm khóa." };
      }

      if (!(await authService.isMatchedPassword(password, account.PASSWORD))) {
        return { error: "Sai mật khẩu." };
      }

      const user = await User.findOne({ _id: account.USER_ID });
      if (!user) {
        throw new Error("Lỗi xảy ra khi truy xuất thông tin user.");
      }

      const accountDevice = await AccountDevice.findOne({ USER_ID: user._id });
      if (!accountDevice) {
        throw new Error("Lỗi xảy ra khi truy xuất tài khoản.");
      }

      const device = await loginDevice(
        accountDevice,
        deviceId,
        deviceName,
        deviceType
      );

      const response = handleUserDataForResponse(user, account, device);

      return response;
    }
  }
};

const handleRefreshToken = async (userId, deviceId) => {
  try {
    const user = await User.findById({ _id: userId });
    const account = await Account.findOne({ USER_ID: userId });
    const userData = {
      USER_ID: user._id,
      USERNAME: account.USERNAME,
      FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].FIRST_NAME,
      LAST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].LAST_NAME,
      EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length - 1].EMAIL,
      DEVICE_ID: deviceId,
      IS_ADMIN: user.ROLE.IS_ADMIN,
      IS_MANAGER: user.ROLE.IS_MANAGER,
      IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
      IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
      IS_ACTIVE: account.IS_ACTIVE,
      AVATAR: user.AVATAR_IMG_URL,
    };
    const { privateKey, error } = await authHelper.getSecretKey(
      userId,
      deviceId
    );
    console.log("error: ", error);
    if (error) {
      return { error: "Thiết bị không hợp lệ 3" };
    }
    const newAccessToken = authService.generateAccessToken(
      userData,
      privateKey
    );
    const expToken = new Date(
      Date.now() + ms(process.env.ACCESS_TOKEN_EXPIRY)
    ).toISOString(); //timpestamp hết hạn
    return { newAccessToken, accessTokenExp: expToken };
  } catch (error) {
    console.error("Lỗi khi làm mới token:", error);
    return { error: "Lỗi khi làm mới token." };
  }
};

const handleLogout = async (userData, refreshToken, accessToken) => {
  try {
    const { publicKey, error } = await authHelper.getSecretKey(
      userData.USER_ID,
      userData.DEVICE_ID
    );
    if (error) {
      return { error: "Thiết bị không hợp lệ 2" };
    }
    if (refreshToken) {
      await addTokenToBlacklist(refreshToken, publicKey);
    }

    if (accessToken) {
      await addTokenToBlacklist(accessToken, publicKey);
    }
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
  }
};

const handleForgotPassword = async (data) => {
  if (!data.email) {
    return { error: "Vui lòng nhập email." };
  }

  const user = await User.findOne({ "LIST_EMAIL.EMAIL": data.email });

  if (!user) {
    return { error: "Email chưa được đăng ký" };
  }

    if (! await authHelper.isValidEmail(user, data.email)) {
        return {error: "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký."}
    }

    data.userId = user._id
    data.firstName = user.FIRST_NAME || ''

    await authService.sendResetPasswordEmail(data)
}

const resetPassword = async (data) => {
    const {userId, newPassword} = data

    const account = await Account.findOne({ USER_ID: userId })

    if (!account) {
        throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
    }

    if (await authService.isMatchedPassword(newPassword, account.PASSWORD)) {
        return {error: "Mật khẩu mới không được trùng với mật khẩu trước đó."}
    }

    account.PASSWORD = await authService.hashPassword(newPassword)

    try {
        account.save()
    } catch (error) {
        throw new Error("Lỗi xảy ra khi đổi mật khẩu.")
    }
}

const updateUser = async (userId, data, deviceId) => {
  const user = await User.findById(userId);
  if (!user) {
    return { error: "Người dùng không tồn tại" };
  }
  // Cập nhật thông tin người dùng
  if (data.firstName || data.lastName || data.middleName) {
    const lastName = data.lastName?.trim() || "";

    const firstName = data.firstName?.trim() || "";
    const middleName = data.middleName?.trim() || "";
    const fullName = `${lastName} ${firstName}`.trim();

    if (!lastName || !firstName) {
      return { error: "Vui lòng nhập đầy đủ họ và tên." };
    }
    const currentName = user.LIST_NAME.find((name) => isValidInfo([name]));
    if (currentName) {
      currentName.THRU_DATE = now;
    }

    user.LIST_NAME.push({
      LAST_NAME: lastName,
      FIRST_NAME: firstName,
      MIDDLE_NAME: middleName,
      FULL_NAME: fullName,
      FROM_DATE: now,
      THRU_DATE: null,
    });
  }

  if (data.gender) {
    user.CURRENT_GENDER = data.gender;
  }
  if (data.dob) {
    user.BIRTH_DATE = new Date(data.dob);
  }
  if (data.avatar) {
    user.AVATAR_IMG_URL = data.avatar;
  }

  // if (data.address) {
  //   const now = new Date();
  //   const currentAddress = user.LIST_ADDRESS.find((address) =>
  //     isValidInfo([address])
  //   );
  //   if (currentAddress) {
  //     currentAddress.THRU_DATE = now;
  //   }
  //   user.LIST_ADDRESS.push({
  //     COUNTRY: data.address.country || "",
  //     CITY: data.address.city || "",
  //     DISTRICT: data.address.district || "",
  //     WARD: data.address.ward || "",
  //     ADDRESS_1: data.address.address1 || "",
  //     ADDRESS_2: data.address.address2 || "",
  //     STATE: data.address.state || "",
  //     FROM_DATE: now,
  //     THRU_DATE: null,
  //   });
  // }
  // Trim từng trường để tránh lỗi do khoảng trắng

  if (data.address) {
    const country = data.address.country?.trim();
    const city = data.address.city?.trim();
    const district = data.address.district?.trim();
    const ward = data.address.ward?.trim();
    const address1 = data.address.address1?.trim();
    const address2 = data.address.address2?.trim();
    const state = data.address.state?.trim();

    if (
      !country ||
      !city ||
      !district ||
      !ward ||
      !address1 ||
      !address2 ||
      !state
    ) {
      return { error: "Vui lòng nhập đầy đủ thông tin địa chỉ." };
    }

    const currentAddress = user.LIST_ADDRESS.find((address) =>
      isValidInfo([address])
    );

    // nếu có thì cập nhật nó thành ngày kết thúc
    if (currentAddress) {
      currentAddress.THRU_DATE = now;
    }

    // tạo bản ghi mới cho địa chỉ
    user.LIST_ADDRESS.push({
      COUNTRY: country,
      CITY: city,
      DISTRICT: district,
      WARD: ward,
      ADDRESS_1: address1,
      ADDRESS_2: address2,
      STATE: state,
      FROM_DATE: now,
      THRU_DATE: null,
    });
  }

  // Trim từng trường để tránh lỗi do khoảng trắng

  if (data.phone) {
    const countryCode = data.phone.countryCode?.trim();
    const countryName = data.phone.countryName?.trim();
    const areaCode = data.phone.areaCode?.trim();
    const phoneNumber = data.phone.phoneNumber?.trim();
    const fullPhoneNumber = data.phone.fullPhoneNumber?.trim();
    if (
      !countryCode ||
      !countryName ||
      !areaCode ||
      !phoneNumber ||
      !fullPhoneNumber
    ) {
      return { error: "Vui lòng nhập đầy đủ thông tin số điện thoại." };
    }

    const currentPhone = user.LIST_PHONE_NUMBER.find((phone) =>
      isValidInfo([phone])
    );

    // nếu có thì cập nhật nó thành ngày kết thúc
    if (currentPhone) {
      currentPhone.THRU_DATE = now;
    }

    // tạo bản ghi mới cho số điện thoại
    user.LIST_PHONE_NUMBER.push({
      COUNTRY_CODE: countryCode || "",
      COUNTRY_NAME: countryName || "",
      AREA_CODE: areaCode || "",
      PHONE_NUMBER: phoneNumber || "",
      FULL_PHONE_NUMBER: fullPhoneNumber || "",
      FROM_DATE: new Date(),
      THRU_DATE: null,
    });
  }
  if (data.contact) {
    const now = new Date();

    // Gộp dữ liệu mới với dữ liệu đang còn hiệu lực
    const lastName =
      data.contact.lastName?.trim() || backupContact?.LAST_NAME || "";
    const firstName =
      data.contact.firstName?.trim() || backupContact?.FIRST_NAME || "";
    const middleName =
      data.contact.middleName?.trim() || backupContact?.MIDDLE_NAME || "";
    const fullName = `${lastName} ${middleName} ${firstName}`.trim();

    const phoneNumber =
      data.contact.phoneNumber?.trim() || backupContact?.PHONE_NUMBER || "";
    const address1 =
      data.contact.address1?.trim() || backupContact?.ADDRESS_1 || "";
    const address2 =
      data.contact.address2?.trim() || backupContact?.ADDRESS_2 || "";
    const email = data.contact.email?.trim() || backupContact?.EMAIL || "";
    const ward = data.contact.ward?.trim() || backupContact?.WARD || "";
    const district =
      data.contact.district?.trim() || backupContact?.DISTRICT || "";
    const city = data.contact.city?.trim() || backupContact?.CITY || "";
    const state = data.contact.state?.trim() || backupContact?.STATE || "";
    const country =
      data.contact.country?.trim() || backupContact?.COUNTRY || "";
    const relationship =
      data.contact.relationship?.trim() || backupContact?.RELATIONSHIP || "";

    const isChange =
      !backupContact || // nếu không có bản cũ thì luôn là thay đổi
      backupContact.LAST_NAME !== lastName ||
      backupContact.FIRST_NAME !== firstName ||
      backupContact.MIDDLE_NAME !== middleName ||
      backupContact.FULL_NAME !== fullName ||
      backupContact.PHONE_NUMBER !== phoneNumber ||
      backupContact.ADDRESS_1 !== address1 ||
      backupContact.ADDRESS_2 !== address2 ||
      backupContact.EMAIL !== email ||
      backupContact.WARD !== ward ||
      backupContact.DISTRICT !== district ||
      backupContact.CITY !== city ||
      backupContact.STATE !== state ||
      backupContact.COUNTRY !== country ||
      backupContact.RELATIONSHIP !== relationship;

    if (isChange) {
      if (backupContact) backupContact.THRU_DATE = now;

      user.LIST_CONTACT.push({
        LAST_NAME: lastName,
        FIRST_NAME: firstName,
        MIDDLE_NAME: middleName,
        FULL_NAME: fullName,
        PHONE_NUMBER: phoneNumber,
        ADDRESS_1: address1,
        ADDRESS_2: address2,
        EMAIL: email,
        WARD: ward,
        DISTRICT: district,
        CITY: city,
        STATE: state,
        COUNTRY: country,
        RELATIONSHIP: relationship,
        FROM_DATE: now,
        THRU_DATE: null,
      });
    }
  }

  // const userData = await user.save();
  // const account = await Account.findOne({ USER_ID: userId });
  // if (!account) {
  //   return { error: "Tài khoản không tồn tại." };
  // }

  // const accountDevice = await AccountDevice.findOne({
  //   "LIST_DEVICE_OF_ACCOUNT.ID_DEVICE": deviceId,
  // });
  // if (!accountDevice) {
  //   return { error: "Thiết bị không tồn tại." };
  // }

  // const device = accountDevice.LIST_DEVICE_OF_ACCOUNT.find((deviceItem) => {
  //   return deviceItem.ID_DEVICE === deviceId;
  // });
  // if (!device) {
  //   return { error: "Khóa thiết bị không hợp lệ." };
  // }

  // const response = handleUserDataForResponse(userData, account, device);

  // return response;
   const userData = await user.save();
   const [account, accountDevice] = await Promise.all([
     Account.findOne({ USER_ID: userId }),
     AccountDevice.findOne({ "LIST_DEVICE_OF_ACCOUNT.ID_DEVICE": deviceId  }),
   ]);
  if (!account) {
    return { error: "Tài khoản không tồn tại." };
  }
  if (!accountDevice) {
    return { error: "Thiết bị không tồn tại." };
  }
   const device = accountDevice.LIST_DEVICE_OF_ACCOUNT.find(d =>d.ID_DEVICE === deviceId);
  if (!device) {
    return { error: "Khóa thiết bị không hợp lệ." };
  }
  return handleUserDataForResponse(userData, account, device);


};

// lấy thông tin người dùng theo id
const getUsers = async ({ page = 1, limit = 10, role }) => {
  try {
    // ép kiểu String thành số
    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // lọc theo role nếu có
    const query = {};
    if (role) {
      if (role === "admin") query["ROLE.IS_ADMIN"] = true;
      else if (role === "manager") query["ROLE.IS_MANAGER"] = true;
      else if (role === "staff") query["ROLE.IS_SERVICE_STAFF"] = true;
      else if (role === "customer") query["ROLE.IS_CUSTOMER"] = true;
    }
    console.log("Truy vấn:", query);
    console.log("QUERY:", query);

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ CREATED_DATE: -1 });

    return {
      total,
      page: pageNumber,
      limit: limitNumber,
      users,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw new Error("Lỗi khi lấy thông tin người dùng");
  }
};

const handleUpdateRoleForUser = async (userId, roleData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: "Người dùng không tồn tại" };
    }

    // Cập nhật vai trò
    user.ROLE.IS_MANAGER = roleData.isManager || false;
    user.ROLE.IS_SERVICE_STAFF = roleData.isServiceStaff || false;
    user.ROLE.IS_CUSTOMER = roleData.isCustomer || false;

    await user.save();

    return user;
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò:", error);
    return { error: "Lỗi khi cập nhật vai trò" };
  }
}

const handleGetUserById = async (userId) => {
    try{
      const user = await User.findById(userId);
      if(!user){
        return {error: "Không tìm thấy người dùng!"};
      }
      const account = await Account.findOne({USER_ID: userId});
      if(!account){
        return {error: "Không tìm thấy tài khoản!"};
      }
        const email = authHelper.isValidInfo(user.LIST_EMAIL);
        const name = authHelper.isValidInfo(user.LIST_NAME);
        const address = authHelper.isValidInfo(user.LIST_ADDRESS);
        const phoneNumber = authHelper.isValidInfo(user.LIST_PHONE_NUMBER);
      return {
        user_data: {
          USER_ID: user._id,
          USERNAME: account.USERNAME,
          NAME: {
            LAST_NAME: name.LAST_NAME,
            FIRST_NAME: name.FIRST_NAME,
            MIDDLE_NAME: name.MIDDLE_NAME,
            FULL_NAME: name.FULL_NAME,
          },
          CURRENT_GENDER: user.CURRENT_GENDER,
          BIRTH_DATE: user.BIRTH_DATE,
          AVATAR_IMG_URL: user.AVATAR_IMG_URL,
          ADDRESS: {
            COUNTRY: address?.COUNTRY,
            CITY: address?.CITY,
            DISTRICT: address?.DISTRICT,
            WARD: address?.WARD,
            ADDRESS_1: address?.ADDRESS_1,
            ADDRESS_2: address?.ADDRESS_2,
            STATE: address?.STATE,
          },
          ROLE: {
            IS_ADMIN: user.ROLE.IS_ADMIN,
            IS_MANAGER: user.ROLE.IS_MANAGER,
            IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
            IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
            IS_ACTIVE: account.IS_ACTIVE,
          },
          EMAIL: email.EMAIL,
          PHONE_NUMBER: {
            COUNTRY_CODE: phoneNumber?.COUNTRY_CODE,
            COUNTRY_NAME: phoneNumber?.COUNTRY_NAME,
            AREA_CODE: phoneNumber?.AREA_CODE,
            PHONE_NUMBER: phoneNumber?.PHONE_NUMBER,
            FULL_PHONE_NUMBER: phoneNumber?.FULL_PHONE_NUMBER,
          }
        },
      };
    }catch(e){
      console.log(e)
      return {error: "Lỗi khi lấy thông tin người dùng!", e};
    }
}

const rollbackCreatingStaffUser = async (id) => {
    try {
      User.deleteOne({ _id: id})
      Account.deleteOne({ USER_ID: id })
      AccountDevice.deleteOne({ USER_ID: id })
    } catch (error) {
      console.log(error)
      throw new Error(error.message)
    }
}

module.exports = {
  handleCreateUser,
  rollbackCreatingStaffUser,
  handleRegistration,
  login,
  handleRefreshToken,
  handleLogout,
  updateUser,
  handleForgotPassword,
  getUsers,
  handleUpdateRoleForUser,
  handleGetUserById,
  resetPassword,
};
