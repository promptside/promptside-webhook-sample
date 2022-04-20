import * as express from 'express';
import Client from '../promptside/Client';
import SaleConfirmPayload from "../promptside/model/webhook/SaleConfirmPayload";
import SaleService from '../promptside/services/core/SaleService';
import WebHookPayload, {Action} from '../promptside/model/webhook/WebHookPayload';
import WebHookService from '../promptside/services/webhook/WebHookService';
import {Logger} from 'winston';
import {Router} from 'express';

export default class WebHookRoute {
    readonly router: Router;

    constructor(private readonly client: Client, private readonly logger: Logger) {
        this.router = express.Router();
        this.router.post('/', (req, res, next) => {
            let webHookService = new WebHookService(this.client);
            let payload: WebHookPayload;
            try {
                if (typeof req.body !== 'string') {
                    throw new Error('Expecting request body to be a string, found '+(typeof req.body));
                }
                payload = webHookService.parsePayload(req.body);
            } catch (err) {
                this.logger.warn('Received web hook with invalid payload', err);
                res.status(400);
                res.send('Bad request');
                return;
            }
            this.handle(payload)
                .then(response => res.send(response))
                .catch(next);
        });
    }

    /**
     * Handle an authenticated Promptside web hook event.
     */
    private async handle(payload: WebHookPayload): Promise<string> {
        //Validate the type of web hook event is the type that we're interested in
        if (payload.action !== Action.sale_confirm) {
            this.logger.info('Ignoring web hook for '+payload.action+' action');
            return 'Ignored';
        }
        let event = payload as SaleConfirmPayload;

        //Example of retrieving additional information about the sale using the REST API
        let saleService = new SaleService(this.client);
        let sale = await saleService.getSale(event.saleId);
        this.logger.info(`Received sale confirmation for sale ID ${sale.id} for $${sale.totalPrice} from customer ${event.customerEmailAddress}`);

        return 'OK';
    }
}
