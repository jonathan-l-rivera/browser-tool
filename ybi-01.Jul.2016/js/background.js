import * as ls from './js/ls.js';
import * as tlds from './js/tld.js';
import * as native from './js/native.js';
import * as notifications from './js/notifications.js';
import * as web_bugs from './js/web_bugs.js';
import * as history from './js/history.js';
import * as api from './js/api.js';
import * as metrics from './js/metrics.js';
import * as profile from './js/profile.js';
import * as settings from './js/settings.js';
import * as utils from './js/utils.js';
import * as trackers_collector from './js/trackers_collector.js';


var URL_WELCOME_PAGE = 'http://intercommedia.diaphanousdesign.com/browser-tool/welcome.html';
var URL_ACTIVATED = 'http://extensiondev.com/ybi_activated.html';
var NOTIFICATIONS_CHECK_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

window.settings = settings;

window.site2info = {};
window.tabId2Tld = {};

window.native = native;

metrics.startCollecting();

if (ls.get('first_run', true)) {
    chrome.tabs.create({url: URL_WELCOME_PAGE});
    ls.set('first_run', false);
}

function enableButton() {
    chrome.browserAction.setIcon({'path': 'img/19.png'});
    chrome.browserAction.setPopup({'popup': 'popup/popup.html'});
}

function prepareHistoryInfo() {
    var result = {}, good = 0, bad = 0, neutral = 0;

    for (let site in site2info) {
        var info = site2info[site];
        var safety = history.getSafety(site);

        if (safety == -1 || safety == 1) {
            neutral++;
        } else if (safety == 0) {
            good++;
        } else {
            console.log('BAD: ' + safety + ", site: " + site);
            bad++;
        }

        result[site] = {
            last_visit: info.last_visit,
            page_views: info.page_views,
            duration: metrics.getDuration(site),
            safety: safety
        };
    }

    return {
        'site2info': result,
        'good_sites': good,
        'bad_sites': bad,
        'neutral_sites': neutral
    };
}

function addListeners() {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        console.log("[background.js] message: " + JSON.stringify(message));
        if (message.action == 'clear-bad-history') {
            history.clearBadHistory(function (removed) {
                removed.forEach((host) => {
                    delete site2info[host];
                });

                sendResponse();
            });
        } else if (message.action == 'send-feedback') {
            api.sendFeedback(message.msg, message.type, (r)=> {
                sendResponse(r.msg);
            });
        } else if (message.action == 'send-error-report') {
            api.sendErrorReport(message.report, sendResponse);
        } else if (message.action == 'start-trackers-collecing') {
            trackers_collector.start();
        } else if (message.action == 'get-profile-data') {
            sendResponse(Object.assign({
                'profile': profile.calculateProfiles(site2info),
                'webBugs': web_bugs.getDetectedWebBugs(),
                'safetyTypes': api.getSafetyTypes()
            }, prepareHistoryInfo()));

            /* Events for handling external application */
        } else if (message.action == 'get-app-state') {

            sendResponse({
                isInstalled: native.isInstalled,
                isEnabled: native.isEnabled,
                isValidSerial: native.isValidSerial,
                errorMessage: native.errorMessage
            });
        } else if (message.action == 'get-app-data') {
            history.getMostRecentRecordTime(function (first_browser_time) {
                native.getNumOfLSO(function (num_of_lso) {
                    native.getFirstHistoryRecordTime(function (first_history_record_time) {
                        sendResponse({
                            num_of_lso: num_of_lso,
                            first_history_record_time_chrome: first_browser_time,
                            first_history_record_time_tool: first_history_record_time
                        });
                    });
                });
            });
        }
        return true;
    });

    chrome.tabs.onRemoved.addListener(function (tabId, info) {
        delete tabId2Tld[tabId];
    });

    chrome.webRequest.onBeforeRequest.addListener(function (data) {
        if (data.type == "main_frame") {
            if (data.tabId && utils.isAccessibleUrl(data.url)) {
                var host = tlds.getTLD(data.url);
                if (!host) {
                    return;
                }

                tabId2Tld[data.tabId] = host;

                var info = site2info[host];
                if (!info) {
                    info = {last_visit: 0, page_views: 0};
                    site2info[host] = info;
                } else {
                    info.last_visit = data.timeStamp;
                    info.page_views += 1;
                }
            }
        }
    }, {urls: ["http://*/*", "https://*/*"]}, []);

}

function initWithHistory(s2i) {

    // console.log('s2i: ' + Object.keys(s2i).length);
    // console.log('\n\n\n\ns2i: ' + JSON.stringify(s2i));

    site2info = s2i;
    history.startMonitoring();

    addListeners();

    enableButton();

}

function onAppActivated() {
    chrome.tabs.create({url: URL_ACTIVATED});
}

function init() {
    api.init(()=> {
        // console.log('~~~ API INITIALIZED ~~~');

        if (native.isInstalled) {
            if (!native.isEnabled) {
                notifications.showErrorNotification('Can\'t enable advanced functionality. Please contact the developers to solve the problem.', native.errorMessage);
            }

            if (localStorage['appActivated'] != 'true') {
                onAppActivated();
                localStorage['appActivated'] = 'true';
            }
        }

        setInterval(notifications.checkNotifications, NOTIFICATIONS_CHECK_INTERVAL);

        web_bugs.startDetection();

        settings.init();

        if (settings.isReportTrackers()) {
            trackers_collector.start();
        } else {
            ls.set('trackers_collector_started', false);
        }

        if (native.isEnabled) {
            native.getHistory((s2i, err, msg) => {
                if (err) {
                    notifications.showErrorNotification('Can\'t get a user history in advanced mode. Please contact the developers to solve the problem.', msg);

                    // We will process in a basic mode.
                    history.collectVisitedDomains((s2i, err, msg) => {
                        initWithHistory(s2i);
                    });
                } else {
                    initWithHistory(s2i);
                }
            });
        } else {
            history.collectVisitedDomains((s2i, err, msg) => {
                initWithHistory(s2i);
            });
        }
    });
}

native.connectNative(init);
