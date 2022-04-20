import AbstractModel from '../AbstractModel';

export enum Action {
    sale_confirm = 'sale_confirm',
}

export default class WebHookPayload extends AbstractModel {
    audience: string;
    subject: string;
    uuid: string;
    action: Action;

    populate(sourceModel: any) {
        this.audience = null;
        this.subject = null;
        this.uuid = null;
        this.action = null;
        super.populate(sourceModel);
        AbstractModel.importStrings(['aud', 'sub', 'jti', 'action'], sourceModel, this);
        this.audience = this['aud'];
        this.subject = this['sub'];
        this.uuid = this['jti'];
    }
}