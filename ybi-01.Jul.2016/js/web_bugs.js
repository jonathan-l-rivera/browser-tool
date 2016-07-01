/*jshint esnexet: true */
'use strict';

/**
 * Created by Viktar Liaskovich on 27.01.2016.
 */

import * as api from 'js/api.js';
import {Storage} from 'js/utils.js';
import * as settings from 'js/settings.js';

class WebBugsStorage extends Storage {
    add(item) {
        for (let i of this._storage) {
            if (i.company.id == item.company.id) {
                i.last_update = item.last_update;
                this._newItems++;

                this.saveIfNecessary();
                return;
            }
        }

        super.add(item);
    }
}

var webBugs;
var detectedWebBugs = new WebBugsStorage('detected_web_bugs', 20);

export function getDetectedWebBugs() {
    let result = [];
    for (let bug of detectedWebBugs.all()) {
        result.push(Object.assign(bug, {blocked: isBlocked(bug)}))
    }

    return result;
}

export function startDetection() {
    webBugs = api.getWebBugs();

    //Some page was loaded. We need to update reporting tab.
    chrome.webRequest.onBeforeRequest.addListener(function (details) {
        if (details.type == "script" || details.type == "image") {
            var bug = detectWebBug(details.url);
            if (bug) {
                detectedWebBugs.add(
                    {
                        company: bug.company,
                        last_update: new Date().getTime()
                    }
                );

                return {cancel: isBlocked(bug)};
            }
        }
    }, {urls: ["http://*/*", "https://*/*"]}, ["blocking"]);
}

export function detectWebBug(url) {
    for (var i = 0; i < webBugs.length; i++) {
        var bug = webBugs[i];

        if (bug.pattern.test(url)) {
            return bug;
        }
    }
}

function isBlocked(bug) {
    return settings.isTypeBlocked(String(bug.company.safety_type_id)) || settings.isWebBugBlocked(bug);
}

