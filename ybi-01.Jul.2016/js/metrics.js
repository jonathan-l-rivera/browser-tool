/**
 * Created by Viktar Liaskovich on 27.01.2016.
 *
 * This module is designed to collect anonymous user activity metrics like recency, frequency and duration.
 */

import * as tlds from 'js/tld.js';
import * as ls from 'js/ls.js';
import * as utils from 'js/utils.js';

export var activityReport = ls.get('activityReport', {});

export function getDuration(site) {
    var d = activityReport[site];
    return d ? d.duration : 0;
}

export function startCollecting() {
    var ACTIVITY_SAVE_INTERVAL = 1;

    var lastActiveTab;
    var tld2start = {};
    var tabId2tab = {};

    var activitySaveCounter = 0;
    // We keep the results for some time in memory to provide a better performance.
    function saveActivity() {
        activitySaveCounter++;

        if (activitySaveCounter == ACTIVITY_SAVE_INTERVAL) {
            ls.set('activityReport', activityReport);
            activitySaveCounter = 0;
        }
    }

    function startTimeRecording(url) {
        let tld = tlds.getTLD(url);
        console.log("tld: " + tld + " for " + url);
        if (!tld) {
            return;
        }

        tld2start[tld] = new Date().getTime();
        console.log("startTimeRecording: " + tld);
    }

    // We need to update frequency only if a user has loaded some new site.
    // If he is surfing on the same site, then we don't need to update it.
    function shouldUpdateFrequency(prevUrl, nextUrl) {
        return tlds.getTLD(prevUrl) != tlds.getTLD(nextUrl);
    }

    function stopTimeRecording(url, updateFrequency) {
        let tld = tlds.getTLD(url);
        if (!tld) {
            return;
        }

        var start = tld2start[tld];
        console.log("stopTimeRecording start: " + start);
        if (!start) {
            // The page never was active. A user simply closed it.
            return;
        }

        let recorded = new Date().getTime() - start;

        // We need to remove start Date here in order to prevent double stopping when a user closing a tab.
        // In this case stopTimeRecording() will be called from onRemove and onActivate events.
        delete tld2start[tld];
        console.log("stopTimeRecording recorded: " + recorded);

        let report = activityReport[tld];
        console.log("stopTimeRecording report: " + report);
        if (!report) {
            report = {
                duration: 0,
                recency: null,
                frequency: 0
            };
            activityReport[tld] = report;
        }

        report.duration += recorded;

        console.log("stopTimeRecording updateFrequency: " + updateFrequency);
        if (updateFrequency) {
            report.frequency += 1;
        }

        console.log("stopTimeRecording: " + tld + ", total: " + report.duration + ", frequency: " + report.frequency);

        saveActivity();
    }

    function injectCollectorScript(tab) {
        try {
            chrome.tabs.executeScript(tab.id, {
                file: "js/lib/jquery-2.1.4.min.js",
                runAt: 'document_start'
            }, function () {
                chrome.tabs.executeScript(tab.id, {
                    file: "js/lib/jquery.idle.js",
                    runAt: 'document_start'
                }, function () {
                    chrome.tabs.executeScript(tab.id, {
                        file: "js/content/metrics.collector.js",
                        runAt: 'document_start'
                    });
                });
            });
        } catch (e) {
            // some pages don't allow contentscript injection.
        }
    }


    chrome.tabs.query({}, function (tabs) {
        tabs.forEach((tab)=> {
            let isAccessible = utils.isAccessibleUrl(tab.url);
            if (tab.active) {
                console.log("Current: " + tab.url);

                lastActiveTab = tab;

                if (isAccessible) {
                    startTimeRecording(tab.url);
                }
            }

            if (isAccessible) {
                tabId2tab[tab.id] = {url: tab.url};

                try {
                    injectCollectorScript(tab);
                } catch (ex) {
                    console.error(ex);
                }
            }
        });
    });

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action == 'on-active') {
            console.log('on-active: ' + sender.tab.url);

            if (sender.tab.active) {
                startTimeRecording(sender.tab.url);
            }
        } else if (message.action == 'on-idle') {
            // Effect 1. We don't need to record a time if the tab is not active.
            // It's timer was stopped inside onActivated event handler.
            //
            // Effect 2. When we inject collector script right after installation of the extension it send on-idle events.
            // We will ignore them too.
            if (sender.tab.active) {
                console.log("on idle" + sender.tab.url);
                stopTimeRecording(sender.tab.url, false);
            }
        }

        return true;
    });

    chrome.tabs.onCreated.addListener(function (tab) {
        tabId2tab[tab.id] = {url: tab.url};
    });


    chrome.tabs.onActivated.addListener(function (data) {
        chrome.tabs.get(data.tabId, function (tab) {
            console.log("Activated: " + tab.url);

            stopTimeRecording(lastActiveTab.url, shouldUpdateFrequency(lastActiveTab.url, tab.url));
            startTimeRecording(tab.url, false);

            lastActiveTab = tab;
        });
    });

    chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
        var prevUrl = tabId2tab[tabId].url;

        if (info.status == 'loading') {
            if (prevUrl != tab.url) {
                stopTimeRecording(prevUrl, shouldUpdateFrequency(tab.url, prevUrl));
            }
        } else if (info.status == 'complete') {
            tabId2tab[tabId].url = tab.url;

            if (tab.active) {
                startTimeRecording(tab.url);
            }
        }
    });

    chrome.tabs.onRemoved.addListener(function (tabId, info) {
        let tab = tabId2tab[tabId];
        console.log("Removed: " + tab.url);

        try {
            stopTimeRecording(tab.url, true);
        } finally {
            delete tabId2tab[tabId];
        }
    });
}
