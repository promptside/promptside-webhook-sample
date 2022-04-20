import WebHookPayload from "./WebHookPayload";

export default class SaleConfirmPayload extends WebHookPayload {
    saleId: number;
    eventId: number;
    eventName: string;
    sessionId: number;
    customerFirstName: string;
    customerSurname: string;
    customerOrgName: string;
    customerEmailAddress: string;
    customerPhone: string;
    customerMarketingOptIn: boolean;
}
