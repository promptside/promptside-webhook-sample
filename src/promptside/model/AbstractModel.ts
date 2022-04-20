import * as moment from 'moment';
import Client from '../Client';
import {AxiosResponse} from 'axios';

export default abstract class AbstractModel {
    protected client?: Client;
    protected _embedded: {[name: string]: any} = {};
    protected _links: {[name: string]: any} = {};

    public constructor(entity: any = {}, client?: Client) {
        if ('_embedded' in entity) {
            this._embedded = entity['_embedded'];
        }
        if ('_links' in entity) {
            this._links = entity['_links'];
        }
        this.client = client;
        this.populate(entity);
    }

    public populate(sourceModel: any) {
        for (let key in sourceModel) {
            this[key] = sourceModel[key];
        }
    }

    public serialize(): {[key: string]: any} {
        return {};
    }

    public get href(): string {
        let hrefs = this.getLinkHrefs('self');
        return (hrefs.length === 1) ? hrefs[0] : null;
    }

    protected getEmbeddedObjects(rel: string): any[] {
        if (!(rel in this._embedded)) {
            return null;
        }
        let embedded = this._embedded[rel];
        if (!Array.isArray(embedded)) {
            embedded = [embedded];
        }
        return embedded;
    }

    protected getEmbeddedObject(rel: string): any {
        let objects = this.getEmbeddedObjects(rel);
        if (!objects || !objects.length) {
            return null;
        }
        return objects[0];
    }

    protected mapEmbeddedObjects<T>(rel: string, modelConstructor: ModelConstructor<T>): T[] {
        let entities = this.getEmbeddedObjects(rel);
        if (entities === null) {
            return null;
        }
        return entities.map(entity => new modelConstructor(entity, this.client));
    }

    protected mapEmbeddedObject<T>(rel: string, modelConstructor: ModelConstructor<T>): T {
        let entity = this.getEmbeddedObject(rel);
        if (entity === null) {
            return null;
        }
        return new modelConstructor(entity, this.client);
    }

    protected mapLinkedOrEmbeddedObjects<T>(rel: string, modelConstructor: ModelConstructor<T>): Promise<T[]> {
        let entities = this.getEmbeddedObjects(rel);
        if (entities !== null) {
            let models = entities.map(entity => new modelConstructor(entity, this.client));
            return Promise.resolve(models);
        }
        if (!this.hasLink(rel)) {
            return Promise.resolve([]);
        }
        return this.resolveMultiLink(rel).then(responses => {
            let entities = responses.map(response => response.data);
            return entities.map(entity => new modelConstructor(entity, this.client));
        });
    }

    protected mapLinkedOrEmbeddedObject<T>(rel: string, modelConstructor: ModelConstructor<T>): Promise<T> {
        let entity = this.getEmbeddedObject(rel);
        if (entity !== null) {
            return Promise.resolve(new modelConstructor(entity, this.client));
        }
        if (!this.hasLink(rel)) {
            return Promise.resolve(null);
        }
        return this.resolveLink(rel).then(response => {
            return new modelConstructor(response.data, this.client);
        });
    }

    protected cachedProperty<T>(cacheKey: string, generatorFunction: () => Promise<T>): Promise<T> {
        if (cacheKey in this) {
            return Promise.resolve(this[cacheKey]);
        }
        return generatorFunction().then(result => {
            this[cacheKey] = result;
            return result;
        });
    }

    protected hasLink(rel: string): boolean {
        return (rel in this._links);
    }

    public getLinkHrefs(rel: string): string[] {
        if (!this.hasLink(rel)) {
            return [];
        }
        let link = this._links[rel];
        if (!Array.isArray(link)) {
            link = [link];
        }
        let hrefs = [];
        for (let i = 0; i < link.length; i++) {
            if ('href' in link[i]) {
                hrefs.push(link[i]['href']);
            }
        }
        return hrefs;
    }

    public getLinkHref(rel: string): string {
        let hrefs = this.getLinkHrefs(rel);
        if (hrefs.length != 1) {
            return null;
        }
        return hrefs[0];
    }

    public getLinkIds(rel: string): number[] {
        if (!this.hasLink(rel)) {
            return [];
        }
        let link = this._links[rel];
        if (!Array.isArray(link)) {
            link = [link];
        }
        let ids = [];
        for (let i = 0; i < link.length; i++) {
            if ('id' in link[i]) {
                ids.push(link[i]['id']);
            }
        }
        return ids;
    }

    public getLinkId(rel: string): number {
        let ids = this.getLinkIds(rel);
        if (ids.length != 1) {
            return null;
        }
        return ids[0];
    }

    protected resolveLink<T>(rel: string): Promise<AxiosResponse<T>> {
        if (!this.hasLink(rel)) {
            return Promise.reject('Link "'+rel+'" does not exist');
        }
        let link = this._links[rel];
        if (Array.isArray(link)) {
            return Promise.reject('Multiple "'+rel+'" links exist');
        }
        if (!('href' in link) || (typeof link.href !== 'string')) {
            return Promise.reject('Link "'+rel+'" does not contain a valid href');
        }
        return this.loadResource(link.href);
    }

    protected resolveMultiLink<T>(rel: string): Promise<AxiosResponse<T>[]> {
        let hrefs = this.getLinkHrefs(rel);
        if (hrefs.length == 0) {
            return Promise.resolve([]);
        }
        let tasks = [];
        for (let href of hrefs) {
            tasks.push(this.loadResource(href));
        }
        return Promise.all(tasks);
    }

    protected loadResource<T>(href: string): Promise<AxiosResponse<T>> {
        if (!this.client) {
            return Promise.reject('No client is configured for resolving links');
        }
        return this.client.request({url: href});
    }

    public static importStrings(keys: string[], sourceModel: {[key: string]: any}, targetModel: any) {
        for (let key of keys) {
            if (key in sourceModel) {
                if (sourceModel[key] === null) {
                    targetModel[key] = null;
                } else {
                    targetModel[key] = String(sourceModel[key]);
                }
            }
        }
    }

    public static importNumbers(keys: string[], sourceModel: {[key: string]: any}, targetModel: any) {
        for (let key of keys) {
            if (key in sourceModel) {
                if (sourceModel[key] === null) {
                    targetModel[key] = null;
                } else if (typeof sourceModel[key] !== 'number') {
                    throw 'Key "'+key+'" is expected to be a number';
                } else {
                    targetModel[key] = sourceModel[key];
                }
            }
        }
    }

    public static importBooleans(keys: string[], sourceModel: {[key: string]: any}, targetModel: any) {
        for (let key of keys) {
            if (key in sourceModel) {
                if (sourceModel[key] === null) {
                    targetModel[key] = null;
                } else if (typeof sourceModel[key] !== 'boolean') {
                    throw 'Key "'+key+'" is expected to be a boolean';
                } else {
                    targetModel[key] = sourceModel[key];
                }
            }
        }
    }

    public static importDates(keys: string[], sourceModel: {[key: string]: any}, targetModel: any) {
        for (let key of keys) {
            if (key in sourceModel) {
                if (sourceModel[key] === null) {
                    targetModel[key] = null;
                } else if (typeof sourceModel[key] === 'object') {
                    targetModel[key] = sourceModel[key];
                } else if (typeof sourceModel[key] !== 'string') {
                    throw 'Key "'+key+'" is expected to be a string or a moment object';
                } else {
                    targetModel[key] = moment.utc(sourceModel[key]);
                }
            }
        }
    }
}

export interface ModelConstructor<T> {
    new (entity: {}, client?: Client): T;
}