import AbstractModel from '../AbstractModel';
import Ticket from './Ticket';

export enum SaleItemType {
    tix = 'tix',
}

export default class SaleItem extends AbstractModel {
    displayOrder: number;
    type: SaleItemType;
    description: string;
    quantity: number;
    unitAmount: string;
    netAmount: string;
    totalAmount: string;

    public getTickets(): Promise<Ticket[]> {
        return this.cachedProperty('tickets', () => this.mapLinkedOrEmbeddedObjects('tickets', Ticket));
    }

    public setTickets(tickets: Ticket[]): void {
        this['tickets'] = tickets;
    }
}