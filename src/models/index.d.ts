import { Sequelize, Model, Optional } from 'sequelize';
declare const sequelize: Sequelize;
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
interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'linkedId' | 'deletedAt'> {
}
export declare class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: 'primary' | 'secondary';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    deletedAt: Date | null;
}
export default sequelize;
//# sourceMappingURL=index.d.ts.map