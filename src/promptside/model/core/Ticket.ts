import AbstractModel from '../AbstractModel';
import {Moment} from 'moment';

export interface TicketHolder {
    firstName: string;
    surname: string;
    orgName: string;
    emailAddress: string;
    phone: string;
    specialRequirements: string;
    marketingOptIn: boolean;
    invitationSentDate: Moment;
    invitationResponseDate: Moment;
}

export default class Ticket extends AbstractModel {
    id: number;
    displayOrder: number;
    uuid: string;
    price: string;
    allocationDate: Moment;
    sentDate: Moment;
    checkinDate: Moment;
    voided: boolean;
    ticketHolder: TicketHolder;

    populate(sourceModel: any) {
        super.populate(sourceModel);
        AbstractModel.importDates(['allocationDate', 'sentDate', 'checkinDate'], sourceModel, this);
        if (this.ticketHolder) {
            AbstractModel.importDates(['invitationSentDate', 'invitationResponseDate'],
                this.ticketHolder, this.ticketHolder);
        }
    }
}
