import AbstractModel from '../AbstractModel';

export enum SaleAdjustmentType {
    tax = 'tax',
    fee = 'fee',
    disc = 'disc',
}

export default class SaleAdjustment extends AbstractModel {
    displayOrder: number;
    type: SaleAdjustmentType;
    amount: string;
    description: string;
}