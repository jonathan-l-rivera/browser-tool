/**
 * Created by Viktar Liaskovich on 27.01.2016.
 */
"use strict";

import * as ls from 'js/ls.js';
import * as api from 'js/api.js';
import {Storage} from 'js/utils.js';



class BlockedSettings {
    constructor(storageName) {
        this._storageName = storageName;
        this._type2blocked = {};
        let storage = ls.get(storageName, {});

        for (let type in storage) {
            this._type2blocked[type] = new Set(storage[type] || []);
        }

        let safetyTypes = api.getSafetyTypes();

        for (let st_id in safetyTypes) {
            let st = safetyTypes[st_id];
            if (!this._type2blocked[st.name]) {
                this._type2blocked[st.name] = new Set();
            }
        }
    }

    save() {
        let storage = {};

        for (let type in this._type2blocked) {
            storage[type] = Array.from(this._type2blocked[type]);
        }

        ls.set(this._storageName, storage);
    }

    empty(type) {
        this._type2blocked[type].clear();
        this.save();
    }

    block(name, type, save = true) {
        this._type2blocked[type].add(name);

        if (save) {
            this.save();
        }
    }

    unblock(name, type, save = true) {
        let storage = this._type2blocked[type];
        if (storage) {
            storage.delete(name);
        }

        if (save) {
            this.save();
        }
    }

    isBlocked(name) {
        for (let type in this._type2blocked) {
            if (this._type2blocked[type].has(name)) {
                return true;
            }
        }

        return false;
    }
}

var blockedWebBugs;
var blockedTypes = ls.get('blockedTypes', []);

export function isUnknownTypeBlocked() {
    var cookieTypes = api.getCookieTypes();

    for (let ct_id in cookieTypes) {
        let ct = cookieTypes[ct_id];
        if (ct.name == 'unknown') {
            return isTypeBlocked(ct_id);
        }
    }

    return false;
}

export function init() {
    blockedWebBugs = new BlockedSettings('blockedWebBugs');

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action == 'change-settings') {
            if (message.option == 'block-trackers') {
                let type = message.property;
                let type_id = api.getSafetyTypeId(type);
                if (type_id) {
                    if (message.value == 'block') {
                        blockSafetyType(type_id);

                        blockedWebBugs.empty(type);
                    } else {
                        unblockSafetyType(type_id);
                    }
                }
            } else if (message.option == 'report-trackers') {
                ls.set('report-trackers', message.value);

                if (message.value == true && !ls.get('trackers_collector_started', true)) {
                    chrome.runtime.sendMessage({action: 'start-trackers-collecing'});
                }
            }
        } else if (message.action == 'block-tracker') {
            var storage = blockedWebBugs;

            if (storage) {
                if (message.value == 'block') {
                    storage.block(message.tracker, message.category);
                } else {
                    storage.unblock(message.tracker, message.category);

                    let type_id = api.getSafetyTypeId(message.category);
                    if (isTypeBlocked(type_id)) {
                        unblockSafetyType(type_id);

                        let detected_web_bugs = new Storage('detected_web_bugs');

                        console.log('message.tracker: ' + message.tracker);
                        for (let wb of detected_web_bugs.all()) {
                            console.log('wb.company.name: ' + wb.company.name);

                            if (wb.company.name != message.tracker) {
                                console.log('block');
                                blockedWebBugs.block(wb.company.name, message.category, false);
                            }
                        }

                        blockedWebBugs.save();
                    }
                }
            }
        }
    });
}

export function isReportTrackers() {
    return ls.get('report-trackers', false);
}

export function isWebBugBlocked(bug) {
    return blockedWebBugs.isBlocked(bug.company.name);
}

export function getBlockedBugTypes() {
    return blockedTypes;
}

export function isTypeBlocked(type_id) {
    return blockedTypes.indexOf(type_id) != -1;
}

function blockSafetyType(type_id) {
    blockedTypes.push(type_id);

    ls.set('blockedTypes', blockedTypes);
}

function unblockSafetyType(type_id) {
    let index = blockedTypes.indexOf(type_id);
    if (index != -1) {
        blockedTypes.splice(index, 1);
    }

    ls.set('blockedTypes', blockedTypes);
}