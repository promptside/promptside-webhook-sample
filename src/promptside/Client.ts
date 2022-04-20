import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import ProblemResponse from './model/ProblemResponse';
import {Logger} from 'winston';

export enum Env {
    production = 'prod',
    test = 'test',
}

export default class Client {
    private readonly env: Env;
    private readonly scope: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly client: AxiosInstance;
    private logger: Logger = null;

    private _tokenUrl: string = null;
    private _webHookPublicKey: string = null;
    private _bearerToken: string = null;

    public authenticationFailureHandler: (AuthenticationError) => void;

    constructor(clientId: string, clientSecret: string, scope: string, tenantShortName: string = null, env = Env.production) {
        this.env = env;
        this.scope = scope;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.client = axios.create();
        let orgPrefix = (tenantShortName !== null) ? tenantShortName+'.' : '';
        if (env == Env.production) {
            this.client.defaults.baseURL = `https://${orgPrefix}app.promptside.io`;
            this._tokenUrl = 'https://idp.promptside.io/oauth2/v1/token';
            this._webHookPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4vGkRMKR4VHJDDNSyWnd\n1KHXcw9zqdHpOn3WR/yzs5eV5AIlDyhq7ntKSEx+I10GiJ9eIK0+ur1k4UH1xN5z\ngQ8wfrhYo3URtHpOrXOt5irYjW26kvOAUH7ImJ2H2LGlJVvSXpLsFLN6KDvm9jcc\nzDqStn1le3O4Dfby9MD0TqvjXJFrCKwiTCfKtYQjcpnHlenyxh8Rb/eV+SsOEH1G\nomFqu4iZxoBInj/2BxUjXT8FAEInbZSKlq2YWcgo7Qj60dhIaLf/FjQ7dXy7R7md\ni51xTwO/jfSYLy7PkcyXS6ca2RBM9OxTSqoFcHhCKteBYLXc/2StULA1QMP8u3b1\n/wIDAQAB\n-----END PUBLIC KEY-----';
        } else if (env == Env.test) {
            this.client.defaults.baseURL = `https://${orgPrefix}test.promptside.io`;
            this._tokenUrl = 'https://idp-test.promptside.io/oauth2/v1/token';
            this._webHookPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxW2tz/mMq0xbTX8TFUIf\nS/uPdm7gOOa4fi4XPO93SGqNDRCZGelry37U1m4WbQt0u6xsill6C7N3oJu/puEy\nRW8Ki+dkzu2ugMCBONbToUOXAYI0VYNWtPt3PqaqBUuq2Gt+iay05awvUH9XpGr+\nQjOWkLxjZNKRtsnQ6s0WEhfWxF+iK8E6I396+lFNzB/ti0czrYvR/jUO6wMtysgY\n+HbYQyr3SRgvGv7uNPMy+Ov9cqtRJ6HXon9Qd5F5awpjxu+9alVGP2t8Fb+cL/CB\n3gKxb6aJ8gKSPd7AgI5+Y+f4TTI61JvaQ6PCzHFwPYxtzO2XkQ1VGFHXs8xwa/7a\nmQIDAQAB\n-----END PUBLIC KEY-----';
        }
    }

    get baseUrl(): string {
        return this.client.defaults.baseURL;
    }

    set baseUrl(value: string) {
        this.client.defaults.baseURL = value;
    }

    get tokenUrl(): string {
        return this._tokenUrl;
    }

    set tokenUrl(value: string) {
        this._tokenUrl = value;
    }

    get webHookPublicKey(): string {
        return this._webHookPublicKey;
    }

    set webHookPublicKey(value: string) {
        this._webHookPublicKey = value;
    }

    get bearerToken(): string {
        return this._bearerToken;
    }

    set bearerToken(value: string) {
        this._bearerToken = value;
    }

    get authenticated(): boolean {
        return !!this._bearerToken;
    }

    public setLogger(logger: Logger): void {
        this.logger = logger;
    }

    public request<T = any, R = AxiosResponse<T>>(request: AxiosRequestConfig): Promise<R> {
        let authenticated = false;
        if (this._bearerToken) {
            authenticated = true;
            request.headers = request.headers || {};
            request.headers['Authorization'] = 'Bearer '+this._bearerToken;
        }
        if (this.logger) {
            this.logger.debug('Sending '+(request.method || 'GET')+' '+request.url);
        }
        return new Promise((resolve, reject) => {
            this.client.request<T, R>(request).then(response => {
                resolve(response);
            }).catch((error: AxiosError) => {
                if (authenticated
                    && error.response
                    && error.response.status === 401
                    && error.response.headers.hasOwnProperty('www-authenticate'))
                {
                    //Refresh the access token, then retry the request
                    this.authenticate().then(newToken => {
                        request.headers['Authorization'] = 'Bearer '+newToken;
                        return this.client.request<T, R>(request);
                    }).then(response => {
                        resolve(response);
                    }).catch(error => {
                        reject(this.processError(error, request));
                    });
                } else {
                    reject(this.processError(error, request));
                }
            });
        });
    }

    public authenticate(): Promise<string> {
        if (this.logger) {
            this.logger.debug('Refreshing access token');
        }
        return new Promise((resolve, reject) => {
            axios.create().request({
                url: this.tokenUrl,
                headers: {
                    Authorization: 'Basic '
                        +Buffer.from(this.clientId+':'+this.clientSecret).toString('base64'),
                },
                data: {
                    grant_type: 'client_credentials',
                    scope: this.scope,
                },
                method: 'POST',
            }).then(response => {
                if (!('data' in response) || !('access_token' in response.data)) {
                    let authError: AuthenticationError = {
                        authenticationError: AuthenticationErrorType.badResponse,
                        message: 'Unexpected response from server',
                        request: response.request,
                        response: response,
                    };
                    if (this.authenticationFailureHandler) {
                        this.authenticationFailureHandler(authError);
                    }
                    reject(authError);
                } else {
                    this.bearerToken = response.data.access_token;
                    resolve(response.data.access_token);
                }
            }).catch((error: AxiosError) => {
                if (error.response) {
                    let response = error.response;
                    let authError: AuthenticationError = {
                        authenticationError: AuthenticationErrorType.serverError,
                        message: 'Authentication failed (status '+response.status+')',
                        request: error.request,
                        response: error.response,
                    };
                    if (response.status === 400 || response.status === 401) {
                        authError.authenticationError = AuthenticationErrorType.credentialsRejected;
                    }
                    if (this.authenticationFailureHandler) {
                        this.authenticationFailureHandler(authError);
                    }
                    reject(authError);
                } else if (error.request) {
                    let authError: AuthenticationError = {
                        authenticationError: AuthenticationErrorType.connectionError,
                        message: 'Connection failed',
                        request: error.request,
                    };
                    if (this.authenticationFailureHandler) {
                        this.authenticationFailureHandler(authError);
                    }
                    reject(authError);
                } else {
                    let authError: AuthenticationError = {
                        authenticationError: AuthenticationErrorType.unknown,
                        message: 'Unknown error',
                    };
                    if (this.authenticationFailureHandler) {
                        this.authenticationFailureHandler(authError);
                    }
                    reject(authError);
                }
            });
        });
    }

    private processError(error: AxiosError, requestConfig?: AxiosRequestConfig): AxiosError<ProblemResponse> {
        if (this.logger) {
            let errorMessage = 'API request returned an error';
            if (requestConfig) {
                errorMessage = 'API request for '+requestConfig.url+' returned an error';
            }
            if (error.response) {
                errorMessage += ' with status '+error.response.status;
            }
            this.logger.debug(errorMessage, error.response ? error.response.data : null);
        }
        if (error.response) {
            if (error.response.headers.hasOwnProperty('content-type')
                && error.response.headers['content-type'] == ProblemResponse.CONTENT_TYPE
                && typeof error.response.data === 'object')
            {
                let problem = new ProblemResponse(error.response.data);
                error.response.data = problem;
                error.message = problem.toDisplayString();
                error['hasProblemResponse'] = true;
            }
        }
        return error;
    }
}

export interface AuthenticationError {
    authenticationError: AuthenticationErrorType;
    message: string;
    request?: any;
    response?: AxiosResponse<any>;
}

export enum AuthenticationErrorType {
    credentialsRejected,
    connectionError,
    serverError,
    badResponse,
    unknown,
}