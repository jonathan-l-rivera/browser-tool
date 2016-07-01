/**
 * Created by Viktar Liaskovich on 27.01.2016.
 *
 */

import {Cache} from 'js/cache.js';
import * as api from 'js/api.js';
import * as tlds from 'js/tld.js';


var SAFETY_GOOD = 0;
var SAFETY_NEUTRAL = 1;
var SAFETY_BAD = 2;
var SAFETY_UNKNOWN = -1;

var LAST_6_MONTH = moment.duration(6, 'months').asMilliseconds();
var LAST_10_YEARS = moment.duration(10, 'years').asMilliseconds();
var LAST_1_YEAR = moment.duration(1, 'years').asMilliseconds();

var domains_cache = new Cache('domains_cache', 20);

var tabs_list = new Set();
var bad_sites = new Set();

function loadHistory(period, callback) {
    console.log('loadHistory: ' + new Date((new Date().getTime() - period)));
    chrome.history.search({
        text: "http",
        startTime: 1,
        maxResults: 10000000
    }, callback);
}

function isBadSite(host) {
    return getSafety(host) == SAFETY_BAD;
}

export function getSafety(domain) {
    var s = domains_cache.get(domain);
    return s === undefined ? SAFETY_NEUTRAL : s;
}

export function clearBadHistory(cb) {
    loadHistory(LAST_10_YEARS, (items) => {
        var removed = new Set();

        for (var item of items) {
            var host = tlds.getTLD(item.url);
            if (!host) {
                continue;
            }

            if (isBadSite(host)) {
                chrome.history.deleteUrl({url : item.url});
                removed.add(host);
            }
        }

        if (removed.size > 0) {
            removed.forEach((host) => {
                domains_cache.remove(host);
            });

            domains_cache.save();
        }

        bad_sites.clear();
        chrome.browserAction.setBadgeText({'text': ''});
        cb(removed);
    });
}

export function getMostRecentRecordTime(cb) {
    loadHistory(LAST_1_YEAR, (items) => {
        var t = Number.MAX_VALUE;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.lastVisitTime < t) {
                t = item.lastVisitTime;
            }
        }

        cb(t);
    });
}

export function collectVisitedDomains(cb) {
    console.log('~collectVisitedDomains~');
    var site2info = {};
    loadHistory(LAST_1_YEAR, (items) => {
        var t = Number.MAX_VALUE;
        console.log('items.length: ' + items.length);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.lastVisitTime < t) {
                t = item.lastVisitTime;
            }

            if (item.url.indexOf("chrome") == 0 || item.url.indexOf("file") == 0) {
                continue;
            }

            var tld = tlds.getTLD(item.url);
            if (!tld) {
                continue;
            }

            var info = site2info[tld];
            if (!info) {
                info = {last_visit: 0, page_views: 0};
                site2info[tld] = info;
            }
            if (item.lastVisitTime > info.last_visit) {
                info.last_visit = item.lastVisitTime;
            }
            info.page_views += 1;
        }
        console.log("item.lastVisitTime: " + new Date(t));


        api.analyzeUserHistory(Object.keys(site2info), (results)=>{
            var badSites = 0;
            for (let domain in results.data) {
                let safety = results.data[domain];
                domains_cache.set(domain, safety);

                if (safety == SAFETY_BAD) {
                    bad_sites.add(domain);
                    badSites++;
                }
            }

            if (badSites > 0) {
                chrome.browserAction.setBadgeText({'text': String(badSites)});
            }
        });

        //TODO: move in callback???
        cb(site2info);
    });
}

function showWarning(tabId) {
    chrome.tabs.executeScript(tabId, {file : 'js/content/history.warning.js', runAt : "document_start"});
}

function reportTheSite(url) {
    var msg = 'I think that the site ' + url + ' is safe for a user. Please review it.';
    api.sendFeedback(msg, api.FEEDBACK_TYPE_IMPROVEMENT, function(response){
        if (response.error) {
            alert(response.msg);
        }
    });
}

var allowedSessions = new Cache();
export function startMonitoring() {
    chrome.webRequest.onBeforeRequest.addListener(function (data) {
        if (data.type == "main_frame") {

            var host = tlds.getTLD(data.url);
            if (!host) {
                if (allowedSessions.hasKey(data.tabId)) {
                    allowedSessions.remove(data.tabId);
                    tabs_list.delete(data.tabId);
                }
                return;
            }

            // Clean Up allowed session if a user navigating to another site
            if (allowedSessions.hasKey(data.tabId) && allowedSessions.get(data.tabId) != host) {
                allowedSessions.remove(data.tabId);
            }

            var cached = domains_cache.get(host);
            console.log('host: ' + host + ", " + ', cached: ' + cached);

            if (cached === undefined) {
                api.checkSite(host, (status)=> {
                    domains_cache.set(host, status);
                    console.log('host: ' + host + ", " + ', status: ' + status + ", data.tabId: " + data.tabId);

                    if (status == SAFETY_BAD) {
                        tabs_list.add(data.tabId);
                        bad_sites.add(host);

                        //TODO: fixit.
                        //TODO: check the case of refresh button on a bad site.
                        chrome.browserAction.setBadgeText({'text': String(bad_sites.size)});
                    }
                });
            } else {
                if (cached == SAFETY_BAD) {
                    tabs_list.add(data.tabId);
                    bad_sites.add(host);
                    chrome.browserAction.setBadgeText({'text': String(bad_sites.size)});
                }
            }
        }
    }, {urls: ["http://*/*", "https://*/*"], types: ['main_frame']}, []);

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'loading') {
            if (tabs_list.has(tabId)) {
                if (!allowedSessions.hasKey(tabId)) {
                    let host = chrome.extension.getBackgroundPage().tabId2Tld[tabId];
                    console.log('allowedSessions.hasValue(' + host + '): ' + allowedSessions.hasValue(host));

                    if (allowedSessions.hasValue(host)) {
                        allowedSessions.set(tabId, host);
                    } else {
                        showWarning(tabId);
                    }
                }
                tabs_list.delete(tabId);
            }
        }
    });

    chrome.tabs.onRemoved.addListener(function (tabId, info) {
        allowedSessions.remove(tabId);
        tabs_list.delete(tabId);
    });
    
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action == "left-the-site") {
            chrome.tabs.remove(sender.tab.id, function(){
                var url = sender.tab.url;
                setTimeout(function(){
                    chrome.history.deleteUrl({url: url});
                }, 1000);
            });
        } else if (message.action == 'report-site') {
            reportTheSite(sender.tab.url);
        } else if (message.action == 'proceed-the-site') {
            var host = tlds.getTLD(sender.tab.url);
            if (!host) {
                return;
            }

            allowedSessions.set(sender.tab.id, host);
        }
    });
}
