import AbstractModel from '../AbstractModel';
import {Moment} from 'moment';

export enum SaleItemType {
    tix = 'tix',
}

export enum SaleAdjustmentType {
    tax = 'tax',
    fee = 'fee',
    disc = 'disc',
}

export enum Status {
    pending = 'pending',
    processing = 'processing',
    confirmed = 'confirmed',
    cancelled = 'cancelled',
}

export enum PaymentStatus {
    notApplicable = 'notApplicable',
    unpaid = 'unpaid',
    partial = 'partial',
    paid = 'paid',
    refunded = 'refunded',
}

export interface SaleItem {
    type: SaleItemType;
    description: string;
    quantity: number;
    unitAmount: string;
    netAmount: string;
    totalAmount: string;
}

export interface SaleAdjustment {
    type: SaleAdjustmentType;
    amount: string;
    description: string;
}

export interface Customer {
    firstName: string;
    surname: string;
    orgName: string;
    emailAddress: string;
    phone: string;
    marketingOptIn: boolean;
}

export interface TicketInfo {
    id: number;
    type: string;
    sessionId: number;
    sectionId: number;
    price: string;
    voided: boolean;
    firstName: string;
    surname: string;
    emailAddress: string;
    orgName: string;
    phone: string;
    specialRequirements: string;
}

export default class Sale extends AbstractModel {
    id: number;
    uuid: string;
    createDate: Moment;
    reserveUntilDate: Moment;
    cancelDate: Moment;
    payDate: Moment;
    refundDate: Moment;
    processDate: Moment;
    items: SaleItem[];
    netPrice: string;
    adjustments: SaleAdjustment[];
    totalPrice: string;
    totalTicketQuantity: number;
    paidAmount: string;
    currencyCode: string;
    paymentMethod: string;
    receiptNumber: string;
    paymentAttempts: number;
    paymentFailureCode: string;
    paymentFailureMessage: string;
    status: Status;
    paymentStatus: PaymentStatus;
    customer: Customer;
    tickets: TicketInfo[];
    lastUpdateDate: Moment;


    populate(sourceModel: any) {
        super.populate(sourceModel);
        AbstractModel.importDates(['createDate', 'reserveUntilDate', 'cancelDate', 'payDate',
            'refundDate', 'processDate', 'lastUpdateDate'], sourceModel, this);
    }

    serialize(): { [p: string]: any } {
        return {
            id: this.id,
            customer: this.customer,
            tickets: this.tickets,
        };
    }
}