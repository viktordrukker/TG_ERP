import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Sequelize with PostgreSQL
const dbUrl = process.env.POSTGRES_URI || 'postgres://postgres:postgres@localhost:5432/tg_erp_auth';
export const sequelize = new Sequelize(dbUrl, {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialect: 'postgres',
});

// Define User model
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Define Role model
export const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
});

// Define Permission model
export const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'permissions',
  timestamps: true,
});

// Define UserRole model (many-to-many)
export const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
}, {
  tableName: 'user_roles',
  timestamps: true,
});

// Define RolePermission model (many-to-many)
export const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
}, {
  tableName: 'role_permissions',
  timestamps: true,
});

// Define relationships
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });

// Export all models
export const models = {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
};

export default models;
