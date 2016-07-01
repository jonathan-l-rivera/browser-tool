/**
 * Created by Viktar Liaskovich on 11.02.2016.
 *
 * This module is designed to detect web bugs based on AdBlock patterns list and send the list of found trackers to our server.
 */

import * as ls from 'js/ls.js';
import * as api from 'js/api.js';
import * as tlds from 'js/tld.js';
import * as trackers from 'js/trackers.js';
import * as settings from 'js/settings.js';


var TRACKERS_THRESHOLD = 10;

var webBugs, unprocessedTrackers;

function findByType(type, url) {
    var patterns = trackers.type2patterns[type];
    if (!patterns) {
        return null;
    }

    for (let i = 0; i < patterns.length; i++) {
        if (url.match(patterns[i])) {
            return url;
        }
    }
}

function findTracker(url) {
    for (let i = 0; i < trackers.patterns.length; i++) {
        if (url.match(trackers.patterns[i])) {
            return url;
        }
    }

    return null;
}

function isTrackerType(type) {
    return type == "script" ||
        type == "image";
}

function sendReport(report) {
    //console.log("@@@@@@@@@@@@@@@@@@@@@ REPORT @@@@@@@@@@@@@@@@@@@@@ ");
    //console.log(JSON.stringify(report));

    for (let tld in report) {
        api.addDetectedTracker(tld, report[tld])
    }
}

// Returns URL without params string
function getUrlOnly(url) {
    var loc = new URL(url);
    return [loc.protocol, '//', loc.host, loc.pathname].join('');
}

function addUnique(arr, elem) {
    var index = arr.indexOf(elem);
    if (index == -1) {
        arr.push(elem);
    }
}

function prepareReport(trackers) {
    var report = {};
    trackers.forEach((tracker)=>{
        var tld = tlds.getTLD(tracker.url);
        if (!tld) {
            return;
        }

        let info = report[tld];
        if (!info) {
            info = report[tld] = {
                urls: [],
                sources: []
            };
        }

        addUnique(info.urls, tracker.url);
        addUnique(info.sources, tracker.source);
    });

    return report;
}


function isWebBug(url) {
    for (var i = 0; i < webBugs.length; i++) {
        var bug = webBugs[i];

        if (bug.pattern.test(url)) {
            return true;
        }
    }

    return false;
}

export function start() {
    webBugs = api.getWebBugs();
    unprocessedTrackers = api.getDetectedTrackers();
    //console.log('unprocessedTrackers: ' + unprocessedTrackers.length);

    var previousTrackers = ls.get('previousTrackers', []);
    //console.log('previousTrackers.length: ' + previousTrackers.length);

    var newTrackers = [];

    function sendReportIfReady() {
        if (newTrackers.length == TRACKERS_THRESHOLD){
            sendReport(prepareReport(newTrackers));

            ls.set('previousTrackers', previousTrackers);
            newTrackers = [];
        }
    }

    chrome.webRequest.onBeforeRequest.addListener(function (data) {
        if (!settings.isReportTrackers()) {
            //console.log('reporting is disabled');
            return;
        }

        if (isTrackerType(data.type)) {
            var tracker = findByType(data.type, data.url);
            if (!tracker) {
                tracker = findTracker(data.url);
            }

            if (tracker && !isWebBug(data.url)) {
                var url = getUrlOnly(data.url);
                if (previousTrackers.indexOf(url) != -1 || unprocessedTrackers.indexOf(url) != -1) {
                    return;
                }

                var pageTld = chrome.extension.getBackgroundPage().tabId2Tld[data.tabId];

                newTrackers.push({url: url, source: pageTld});
                previousTrackers.push(url);

                sendReportIfReady();
                //console.log(data.type + ' @@@@----> NEW TRACKER: (' + newTrackers.length + ') ' + tracker);
            }
        }
    }, {urls: ["http://*/*", "https://*/*"]}, []);

    ls.set('trackers_collector_started', true);
}
