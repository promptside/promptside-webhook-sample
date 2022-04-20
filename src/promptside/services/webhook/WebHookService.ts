import * as jwt from 'jsonwebtoken';
import AbstractService from '../AbstractService';
import WebHookPayload from '../../model/webhook/WebHookPayload';

export default class WebHookService extends AbstractService {
    /**
     * Throws an error if the payload is invalid, expired, or not correctly signed.
     *
     * @param {string} payload The POST body sent to the web hook endpoint
     */
    public parsePayload(payload: string): WebHookPayload {
        let decodedPayload = jwt.verify(payload, this.client.webHookPublicKey) as object;
        return new WebHookPayload(decodedPayload, this.client);
    }
}