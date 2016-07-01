/**
 * Cache object with an ability to store it's state in the localStorage
 * TODO: add remove() method, add MAX_SIZE param
 *
 * Created by Viktar Liaskovich on 17.03.2016.
 */

import * as ls from 'js/ls.js';

export class Cache {
    constructor(storageName = null, threshold = 0) {
        this._storageName = storageName;
        this._threshold = threshold;

        this._storage = storageName ? ls.get(storageName, {}) : {};
        this._newItems = 0;
    }

    get(item) {
        return this._storage[item];
    }

    set(item, val) {
        this._storage[item] = val;
        this._newItems++;

        if (this._storageName) {
            if (this._threshold == 0 || this._threshold == this._newItems) {
                this.save();
            }
        }
    }

    hasKey(key) {
        return key in this._storage;
    }

    hasValue(val) {
        for (let key in this._storage) {
            if(this._storage[key] == val) {
                return true;
            }
        }

        return false;
    }

    remove(key, updateStorage = false) {
        delete this._storage[key];

        if (this._storageName) {
            if (updateStorage) {
                this.save();
            }
        }
    }

    save() {
        ls.set(this._storageName, this._storage);
        this._newItems = 0;
    }

    purge() {
        if (this._storageName) {
            ls.set(this._storageName, {});
        }
        this._storage = {};
    }
}
