import AbstractModel from '../AbstractModel';

export interface TicketDescriptor {
    ticketTypeId: number;
    sessionSectionId: number;
}

export default class TicketRequest extends AbstractModel {
    sessionId: number = null;
    discountCode: string = null;
    tickets: TicketDescriptor[] = [];

    serialize(): { [p: string]: any } {
        return {
            sessionId: this.sessionId,
            discountCode: this.discountCode,
            tickets: this.tickets,
        };
    }
}