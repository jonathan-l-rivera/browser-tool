/**
 * Created by Viktar Liaskovich on 24.03.2016.
 */

export function isAccessibleUrl(url) {
    return url && url.indexOf("chrome:") != 0 && url.indexOf("about:") != 0 && url.indexOf('view-source:') != 0 && url.indexOf('https://chrome.google.com') != 0;
}


import * as ls from 'js/ls.js';

export class Storage {
    constructor(storageName = null, threshold = 0) {
        this._storageName = storageName;
        this._threshold = threshold;

        this._storage = storageName ? ls.get(storageName, []) : [];
        this._newItems = 0;
    }

    add(item) {
        this._storage.push(item);
        this._newItems++;

        if (this._storageName) {
            this.saveIfNecessary();
        }
    }

    saveIfNecessary() {
        if (this._threshold == 0 || this._threshold == this._newItems) {
            this.save();
        }
    }

    save() {
        ls.set(this._storageName, this._storage);
        this._newItems = 0;
    }

    all() {
        return this._storage;
    }
}