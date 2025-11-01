const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
    file_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    group_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    caption: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Message;