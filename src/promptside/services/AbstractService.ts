import Client from '../Client';

export default abstract class AbstractService {
    protected client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}