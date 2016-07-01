/**
 * Created by Viktar Liaskovich on 30.05.2016.
 */
import * as ls from 'js/ls.js';
import * as api from 'js/api.js';

export function showErrorNotification(msg, details) {
    let NOTIFICATION_ID = "ybi-error-notification";

    var opt = {
        type: "basic",
        title: "Your Browsing Insights: Error",
        message: msg,
        iconUrl: "img/128_error.png",
        buttons: [{
            title: 'Send Report',
            iconUrl: 'img/send-report-32.png'
        }]

    };

    chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
        if (notificationId == NOTIFICATION_ID) {
            let email = prompt('Please leave your email to update you about the problem.');

            chrome.runtime.getPlatformInfo((info)=> {
                api.sendErrorReport("Msg: " + details + ". Platform info: " + JSON.stringify(info) + ". Email: " + (email || ""), (r)=> {
                    if (r.error) {
                        alert(r.msg);
                    } else {
                        alert("We've received your report. Thank you.");
                    }

                    chrome.notifications.clear(notificationId);
                });
            });
        }
    });

    chrome.notifications.create(NOTIFICATION_ID, opt, function () {});
}

function showNotification(nf, cb) {
    let NOTIFICATION_ID = "ybi-msg-notification";

    var opt = {
        type: "basic",
        title: nf.title,
        message: nf.message,
        iconUrl: "img/128.png",
        buttons: nf.actions.map((a) => {
            return {title: a.label};
        })
    };

    chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
        if (notificationId == NOTIFICATION_ID) {
            let btn = nf.actions[buttonIndex];
            let url = btn.url;
            if (url) {
                chrome.tabs.create({url: url});
                api.updateNotificationButton(btn.id, (btn.clicks || 0) + 1);
            }
            chrome.notifications.clear(notificationId);
        }
    });

    chrome.notifications.create(NOTIFICATION_ID, opt, function () {
        api.updateNotificationStatistic(nf.id, (nf.delivered || 0) + 1);
        cb && cb();
    });
}


export function checkNotifications() {
    api.getNotifications((notifications) => {
        if (notifications.length == 0) {
            return;
        }

        let nf = notifications[0];
        let last_notification = ls.get('last_notification');
        if (last_notification != nf.date) {

            showNotification(nf, ()=> {
                ls.set('last_notification', nf.date);
            });
        }
    });
}