import AbstractModel from './AbstractModel';
import ValidationError from './ValidationError';

export default class ProblemResponse {
    public type: string;
    public title: string;
    public status: number;
    public detail: string;
    public validationErrors: ValidationError[] = [];

    public constructor(entity: any = {}) {
        AbstractModel.importStrings(['type', 'title', 'detail'], entity, this);
        AbstractModel.importNumbers(['status'], entity, this);

        if ('validation_messages' in entity && typeof entity['validation_messages'] === 'object') {
            let validation = entity['validation_messages'];
            for (let context in validation) {
                if (typeof validation[context] !== 'object') {
                    continue;
                }
                for (let type in validation[context]) {
                    if (typeof validation[context][type] !== 'string') {
                        continue;
                    }
                    this.validationErrors.push(
                        new ValidationError(context, type, validation[context][type])
                    );
                }
            }
        }
    }

    public get hasValidationErrors(): boolean {
        return (this.validationErrors.length > 0);
    }

    public getErrorsForContext(context: string): ValidationError[] {
        return this.validationErrors.filter(err => err.context == context);
    }

    public toDisplayString(): string {
        if (this.validationErrors.length > 1) {
            let messages = this.validationErrors.map(err => '- '+err.message);
            return messages.join('\n');
        }
        if (this.hasValidationErrors) {
            return this.validationErrors[0].message;
        }
        if (this.detail && this.detail.length) {
            return this.detail;
        }
        return this.title;
    }

    public static readonly CONTENT_TYPE = 'application/problem+json';
}