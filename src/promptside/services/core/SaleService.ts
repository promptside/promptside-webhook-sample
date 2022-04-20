import AbstractService from '../AbstractService';
import Sale from '../../model/core/Sale';

/**
 * @see https://promptside.io/developer/reference/core#operations-tag-Sales
 */
export default class SaleService extends AbstractService {
    /**
     * Retrieve a sale.
     */
    public getSale(id: number): Promise<Sale> {
        let url = '/core/v1/sales/'+id.toString();
        return this.client.request({url: url}).then(response => {
            return new Sale(response.data, this.client);
        });
    }
}
