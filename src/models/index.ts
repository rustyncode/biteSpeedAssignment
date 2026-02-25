import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

import pg from 'pg';

if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL environment variable is missing!');
}

const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false,
});

interface ContactAttributes {
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'linkedId' | 'deletedAt' | 'createdAt' | 'updatedAt'> { }

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
    declare id: number;
    declare phoneNumber: string | null;
    declare email: string | null;
    declare linkedId: number | null;
    declare linkPrecedence: 'primary' | 'secondary';
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare deletedAt: Date | null;
}

Contact.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        linkedId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        linkPrecedence: {
            type: DataTypes.ENUM('primary', 'secondary'),
            allowNull: false,
            defaultValue: 'primary',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'contacts',
        paranoid: true,
        timestamps: true,
    }
);

export default sequelize;
