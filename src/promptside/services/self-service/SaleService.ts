import AbstractService from "../AbstractService";
import Sale from "../../model/self-service/Sale";
import TicketRequest from "../../model/self-service/TicketRequest";

/**
 * @see https://promptside.io/developer/reference/self-service#operations-tag-Sales
 */
export default class SaleService extends AbstractService {
    /**
     * Retrieve the customer view of a sale.
     */
    public getSale(uuid: string): Promise<Sale> {
        let url = '/self-service/v1/sales/'+uuid;
        return this.client.request({url: url}).then(response => {
            return new Sale(response.data, this.client);
        });
    }

    /**
     * Create a new pending sale, temporarily reserving tickets.
     */
    public createSale(request: TicketRequest): Promise<Sale> {
        return this.client.request({
            url: '/self-service/v1/sales',
            method: 'POST',
            data: request.serialize(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        }).then(response => {
            return new Sale(response.data, this.client);
        });
    }

    /**
     * Update the customer and ticket holder details for a pending sale.
     */
    public saveChangesToSale(sale: Sale): Promise<Sale> {
        return this.client.request({
            url: '/self-service/v1/sales/'+sale.uuid,
            method: 'PUT',
            data: sale.serialize(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        }).then(response => {
            return new Sale(response.data, this.client);
        });
    }

    /**
     * Finalize a pending sale (and submit it for payment processing, if applicable).
     */
    public commitSale(uuid: string, paymentToken?: string): Promise<Sale> {
        let data = {};
        if (paymentToken) {
            data['paymentToken'] = paymentToken;
        }
        return this.client.request({
            url: '/self-service/v1/sales/'+uuid+'/commit',
            method: 'POST',
            data: data,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        }).then(response => {
            return new Sale(response.data, this.client);
        });
    }

    /**
     * Cancel a pending sale.
     */
    public cancelSale(uuid: string): Promise<void> {
        return this.client.request({
            url: '/self-service/v1/sales/'+uuid,
            method: 'delete',
        }).then(() => {
            return null;
        });
    }
}
