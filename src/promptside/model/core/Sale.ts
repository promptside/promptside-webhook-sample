import AbstractModel from '../AbstractModel';
import SaleAdjustment from './SaleAdjustment';
import SaleItem from './SaleItem';
import {Moment} from 'moment';

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

export interface Customer {
    firstName: string;
    surname: string;
    orgName: string;
    emailAddress: string;
    phone: string;
    marketingOptIn: boolean;
}

export default class Sale extends AbstractModel {
    id: number;
    uuid: string;
    liveMode: boolean;
    createDate: Moment;
    reserveUntilDate: Moment;
    cancelDate: Moment;
    payDate: Moment;
    refundDate: Moment;
    processDate: Moment;
    netPrice: string;
    totalPrice: string;
    totalTicketQuantity: number;
    paidAmount: string;
    netCommission: string;
    totalCommission: string;
    currencyCode: string;
    paymentMethod: string;
    receiptNumber: string;
    paymentAttempts: number;
    paymentFailureCode: string;
    paymentFailureMessage: string;
    status: Status;
    paymentStatus: PaymentStatus;
    customer: Customer;
    lastUpdateDate: Moment;


    populate(sourceModel: any) {
        super.populate(sourceModel);
        AbstractModel.importDates(['createDate', 'reserveUntilDate', 'cancelDate', 'payDate',
            'refundDate', 'processDate', 'lastUpdateDate'], sourceModel, this);
    }

    public getItems(): Promise<SaleItem[]> {
        return this.cachedProperty('items', () => this.mapLinkedOrEmbeddedObjects('items', SaleItem));
    }

    public setItems(items: SaleItem[]): void {
        this['items'] = items;
    }

    public getAdjustments(): Promise<SaleAdjustment[]> {
        return this.cachedProperty('adjustments', () => this.mapLinkedOrEmbeddedObjects('adjustments', SaleAdjustment));
    }

    public setAdjustments(adjustments: SaleAdjustment[]): void {
        this['adjustments'] = adjustments;
    }
}