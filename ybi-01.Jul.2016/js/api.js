var SERVER_BASE = 'http://collector-tool-dev.elasticbeanstalk.com/';
// var SERVER_BASE = 'http://127.0.0.1:5000/';

var URL_SAFETY_TYPES = SERVER_BASE + 'api/safety_types';
var URL_WEB_BUGS = SERVER_BASE + 'api/web_bugs';
var URL_COMPANIES = SERVER_BASE + 'api/companies';
var URL_SITE_INFOS = SERVER_BASE + 'api/site_infos';
var URL_SEND_FEEDBACK = SERVER_BASE + 'api/send_feedback';
var URL_SEND_ERROR_REPORT = SERVER_BASE + 'api/send_error_report';
var URL_DETECTED_TRACKERS = SERVER_BASE + 'api/detected_trackers';
var URL_ANALYZE_HISTORY = SERVER_BASE + 'api/analyze_history';
var URL_CHECK_SITE = SERVER_BASE + 'api/check_site';
var URL_NOTIFICATIONS = SERVER_BASE + 'api/notifications?q={"order_by":[{"field":"date","direction":"desc"}]}';
var URL_NOTIFICATION_UPDATE = SERVER_BASE + 'api/notifications/';
var URL_NOTIFICATION_ACTION_UPDATE = SERVER_BASE + 'api/notification_actions/';

export var FEEDBACK_TYPE_IMPROVEMENT = 2;

var safetyTypes, webBugs, companies, detectedTrackers;

import * as ls from 'js/ls.js';

export function getSiteInfo(tld) {
    return site2info[tld];
}

export function getWebBugs() {
    return webBugs;
}

export function getSafetyTypes() {
    return safetyTypes;
}
export function getSafetyTypeId(name) {
    for (let type_id in safetyTypes) {
        let ct = safetyTypes[type_id];
        if (ct.name == name) {
            return type_id;
        }
    }
}

export function getDetectedTrackers() {
    return detectedTrackers;
}

export function analyzeUserHistory(domains, callback) {
    //console.log('domains: ' + JSON.stringify(domains));

    $.ajax({
        type: 'POST',
        url: URL_ANALYZE_HISTORY,
        data: JSON.stringify({'domains': domains}),
        dataType: "json",
        contentType: "application/json",
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        success: callback
    });
}

export function checkSite(domain, callback) {
    loadData(URL_CHECK_SITE + "?domain=" + domain).then(function (response) {
        callback(response.block);
    });
}

export function getNotifications(callback) {
    loadData(URL_NOTIFICATIONS).then(function (response) {
        callback(response.objects);
    });
}

export function updateNotificationStatistic(id, delivered) {
    updateData(URL_NOTIFICATION_UPDATE + id, {delivered: delivered});
}

export function updateNotificationButton(id, clicks) {
    updateData(URL_NOTIFICATION_ACTION_UPDATE + id, {clicks: clicks});
}

var site2info = {};

function loadData(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: resolve
        });
    });
}
function updateData(url, data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            contentType: "application/json",
            method: "PATCH",
            url: url,
            data: JSON.stringify(data),
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            success: resolve
        });
    });
}

function prepareSiteInfos(infos) {
    var result = {};

    infos.objects.forEach((info) => {
        for (var k in info) {
            if (info[k] === null) {
                info[k] = 0;
            }
        }
        result[info.site] = info;
    });

    return result
}

function prepareSafetyTypes(types) {
    var result = {};

    types.objects.forEach((t) => {
        result[t.id] = {'fullname': t.fullname, 'name': t.name, 'description': t.description};
    });

    return result
}

function prepareWebBugs(bugs) {
    bugs.objects.forEach((b) => {
        try {
            b.pattern = new RegExp(b.pattern, 'i');
        } catch(e) {
            console.error(e);
            //Ignore regexps with wrong syntax.
            //TODO: send report to admin panel.
        }
    });
    return bugs.objects;
}

function prepareDetectedTrackers(trackers) {
    return trackers.objects;
}

function prepareCompanies(companies) {
    return companies.objects;
}


//Prevent AJAX requests from caching.
$.ajaxSetup({cache: false});

function createTrackerData(domain, urls) {
    return JSON.stringify({
        "domain": domain,
        "urls": urls
    });
}

export function addDetectedTracker(doamin, urls, callbck) {
    $.ajax({
        type: 'POST',
        url: URL_DETECTED_TRACKERS,
        data: createTrackerData(doamin, urls),
        dataType: "json",
        contentType: "application/json",
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        success: callbck
    });
}

export function sendFeedback(message, type, callback) {
    $.ajax({
        type: 'POST',
        url: URL_SEND_FEEDBACK,
        data: JSON.stringify({
            "message": message,
            "type": type
        }),
        dataType: "json",
        contentType: "application/json",
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        success: callback,
        error: ()=> {
            callback && callback({error: true, msg:'Something went wrong :-(. Please email your feedback at: dennis@imttech.co.uk'});
        }
    });
}

export function sendErrorReport(report, callback) {
    $.ajax({
        type: 'POST',
        url: URL_SEND_ERROR_REPORT,
        data: JSON.stringify({
            "report": report
        }),
        dataType: "json",
        contentType: "application/json",
        headers: {'X-Requested-With': 'XMLHttpRequest'}
    }).always(callback);
}

export function init(cb) {
    Promise.all([loadData(URL_SITE_INFOS), loadData(URL_SAFETY_TYPES), loadData(URL_WEB_BUGS), loadData(URL_COMPANIES), loadData(URL_DETECTED_TRACKERS)]).then((result) => {
        site2info = prepareSiteInfos(result[0]);

        safetyTypes = prepareSafetyTypes(result[1]);
        ls.set('safetyTypes', safetyTypes);

        ls.set('webBugs', result[2]);
        webBugs = prepareWebBugs(result[2]);

        companies = prepareCompanies(result[3]);
        ls.set('companies', companies);

        detectedTrackers = prepareDetectedTrackers(result[4]);
        ls.set('detectedTrackers', detectedTrackers);

        cb && cb();
    });
}
