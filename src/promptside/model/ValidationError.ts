export default class ValidationError {
    public context: string;
    public type: string;
    public message: string;

    public constructor(context: string, type: string, message: string) {
        this.context = context;
        this.type = type;
        this.message = message;
    }

    public static readonly TYPE_CONFLICTING = 'conflictingValue';
    public static readonly TYPE_INVALID = 'notValid';
    public static readonly TYPE_MISSING = 'isEmpty';
    public static readonly TYPE_NOT_NUMBER = 'notDigits';
    public static readonly TYPE_TOO_LONG = 'stringLengthTooLong';
    public static readonly TYPE_TOO_SHORT = 'stringLengthTooShort';
    public static readonly TYPE_UNRECOGNIZED = 'unrecognized';
}
