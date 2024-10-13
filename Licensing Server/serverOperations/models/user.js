
const {Sequelize,Model,DataTypes} = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
  });
class User extends Model {}
User.init({
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true,
    },
    username:{
        type:DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false
    }
},{
    sequelize,
    underscored: true,
    timestamps: true,
    modelName:'user'
})

User.sync({ force: true });

module.exports = User