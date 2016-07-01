"use strict";

function init() {
    var bg = chrome.extension.getBackgroundPage();

    var settings = bg.settings;
    var native = bg.native;

    // if (navigator.userAgent.indexOf('Mac OS X') != -1) {
    //     var reloaded = sessionStorage['reloaded'];
    //     if (!reloaded) {
    //         sessionStorage['reloaded'] = 'true';
    //         document.location.reload();
    //     } else {
    //         $('body').css('visibility', 'visible');
    //     }
    // } else {
    //     $('body').css('visibility', 'visible');
    // }


    var PAGE_SIZE = 12;

    // Tab Actions
    $('.js-go-to-frame').click(function (event) {
        var parent = $(this).parent();
        if (!$(this).hasClass('is-active')) {
            var target = $(this).attr('data-target');
            $(target).removeClass('off-right');
            $(target).removeClass('off-left');
            $(target).siblings('.frame').each(function () {
                if ($(this).index() > $(target).index()) {
                    $(this).removeClass('off-left');
                    $(this).addClass('off-right');
                } else {
                    $(this).removeClass('off-right');
                    $(this).addClass('off-left');
                }
            });
            parent.find('.is-active').removeClass('is-active');
            $(this).addClass('is-active');
            $(target).parent().find('.current-frame').removeClass('current-frame');
            $(target).addClass('current-frame');
        }
        return false;
    });

    /**********************************************************
     *
     *          Error Screen navigation and handling
     *
     **********************************************************/

    $("#send-error-report").click(function () {
        chrome.runtime.sendMessage({'action': 'send-error-report', report: localStorage['error_stack']}, function () {
            $('#error').fadeOut('fast');
            localStorage.removeItem('error_stack');
        });
    });

    $("#reload-popup").click(function () {
        document.location.reload();
    });

    /**********************************************************
     *
     *          User Guide navigation and handling
     *
     **********************************************************/
    if (localStorage['skip_guide'] != 'true') {
        $('.guide').show();
        localStorage['skip_guide'] = 'true';
    }

    $('.guide-btn-skip').click(function () {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.guide').fadeOut('fast');
            $('[data-target="#profile-panel"], [data-target="#current-profile"]').click();
        }
    );

    var PAGE_HANDLERS = {
        '1': function nextGuide1() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-2');
            $('.step').hide();
            $('.step-2').fadeIn('fast');
            $('.guide');
        }, '2': function nextGuide2() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-3');
            $('.step').hide();
            $('.step-3').fadeIn('fast');
        }, '3': function nextGuide3() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-4');
            $('.step').hide();
            $('.step-4').fadeIn('fast');
            $('[data-target="#long-term-profile"]').click();
        },
        '4': function nextGuide4() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-5');
            $('.step').hide();
            $('.step-5').fadeIn('fast');
            $('[data-target="#cookies-panel"]').click();
            $('[data-target="#website-cookies"]').click();
        }, '5': function nextGuide5() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-6');
            $('.step').hide();
            $('.step-6').fadeIn('fast');
        }, '6': function nextGuide6() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-7');
            $('.step').hide();
            $('.step-7').fadeIn('fast');
            $('[data-target="#thirdparty-cookies"]').click();
        }, '7': function nextGuide7() {
            $('.browser-tool').removeClass('guide-1 guide-2 guide-3 guide-4 guide-5 guide-6 guide-7 guide-8');
            $('.browser-tool').addClass('guide-8');
            $('.step').hide();
            $('.step-8').fadeIn('fast');
        }
    };

    $('.guide-btn-next').click(function () {
            var page = $(this).attr('data-page');
            PAGE_HANDLERS[page]();
        }
    );

    $('#btn-open-guide').click(function () {
        $('.guide').fadeIn('fast').css('background-color', 'rgba(0, 0, 0, 0.80)');
        $('.step').hide();
        $('.step-1').fadeIn('fast');
        $('[data-target="#profile-panel"], [data-target="#current-profile"], [data-target="#website-cookies"]').click();
    });

    /**********************************************************
     *
     *     Filtering trackers and history
     *
     **********************************************************/
    $('.filter-bar').each(function () {
        var filterBar = this;
        $('.filter-item', this).click(function (event) {
            $(this).toggleClass('is-active');

            var target = $(this).attr('data-target');
            // if (target == '#site-cookies') {
            //     loadFullHistory();
            // } else if (target == '#third-cookies') {
            //     loadFullTrackers();
            // }

            if ($(this).parent().find('.filter-item.is-active').length > 0) {
                $(target + ' tr').hide();
            } else {
                $(target + ' tr').show();
            }

            $('.filter-item', filterBar).each(function () {
                if ($(this).hasClass('is-active')) {
                    var filter_target = $(this).attr('data-target');
                    var filter_class = $(this).attr('data-filter');

                    // It was slideDown('fast'). But it takes 2 second to update UI. So, changed to fast show()
                    $(filter_target + ' ' + filter_class).show();
                }
            });
        });
    });

    /**********************************************************
     *
     *     Advanced Options
     *
     **********************************************************/

    function updateLSO(callback) {
        bg.native.getNumOfLSO(function (lso, err, errMsg) {
            console.log('err: ' + err);
            if (err) {
                showModal(errMsg);
            } else {
                console.log('LSO: ' + lso);
                callback(lso);
            }
        });
        console.log('send lso request');
    }

    function showAdvancedInfo() {
        console.log('updating LSO...');
        updateLSO(function(lso){
            $('#total-number-flash').text(String(lso));
            $('#app-valid-serial').append('<p>Number of LSO: ' + lso + '</p>')
        });
        $('#app-valid-serial').show();
    }


    console.log('native.isInstalled: ' + native.isInstalled);
    console.log('native.isEnabled: ' + native.isEnabled);
    console.log('native.isValidSerial: ' + native.isValidSerial);

    if (native.isInstalled) {
        $('#app-not-installed').hide();

        if (native.isEnabled) {
            $('#app-not-enabled').hide();

            if (native.isValidSerial) {
                $('#app-no-serial').hide();

                showAdvancedInfo();
            } else {
                $('#app-no-serial').show();

                updateLSO(function(lso){
                    $('#total-number-flash').text(String(lso));
                });
            }
        } else {
            $('#app-not-enabled').show();
        }
    } else {
        $('#app-not-installed').show();
    }

    $('#apply-serial').click(function () {
        var sn = $.trim($('#serial-number').val());
        console.log('sn.length: ' + sn.length);
        if (sn.length == 0) {
            showModal('Please enter your serial number.');
        } else {
            bg.native.checkSerial(sn, function (isValid) {
                if (isValid) {
                    showModal('Your Serial Number is valid!');
                    $('#app-no-serial').hide();

                    showAdvancedInfo();

                    localStorage['serialNumber'] = sn;
                } else {
                    showModal('Entered Serial Number is not valid.');
                }
            });
        }
    });

    /**********************************************************
     *
     *     Removing all bad history
     *
     **********************************************************/
    $('#clear-bad-history, #clear-all-bad, .js-clear-all').click(function (event) {
        chrome.runtime.sendMessage({'action': 'clear-bad-history'}, function () {
            var remove_type = $(this).attr('data-remove');
            $("#bad-sites, #settings-history-badge").text('0');

            if (remove_type == 'all') {
                $(this).parents('.frame').find('tr').remove();
            } else {
                $(this).parents('.frame').find('tr.bad').remove();
            }
            $(this).parents('.frame').removeClass('has-bad');
        }.bind(this));
    });


    /**********************************************************
     *
     *     Feedback Textarea: character counter initialization
     *
     **********************************************************/
    $('textarea#feedback-msg').characterCounter();

    /**********************************************************
     *
     *     Load history items and trackers on scrolling
     *
     **********************************************************/
    function scrollOnBottom(callback) {
        return function (e) {
            var elem = $(e.currentTarget);
            if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
                callback();
            }
        };
    }

    $("#history-table").parent().bind('scroll', scrollOnBottom(function () {
        addHistoryPage($("#site-cookies"));
    }));

    $("#trackers-table").parent().bind('scroll', scrollOnBottom(function () {
        addTrackersPage($("#third-cookies"));
    }));

    var userHistory, activityReport, webBugs;
    var historyCnt = 0, historyPage = 0, webBugsCnt = 0, webBugsPage = 0;

    var site2info;

    var safetyTypes;
    var SAFETY_TYPE_UNKNOWN;
    var SAFETY_CLS = {
        '-1': 'neutral',
        '0': 'good',
        '1': 'neutral',
        '2': 'bad'
    };

    function isHistoryLoaded() {
        return historyCnt == userHistory.length;
    }

    function isTrackersLoaded() {
        return webBugsCnt == webBugs.length;
    }

    function loadFullHistory() {
        var historyRoot = $("#site-cookies");

        while (!isHistoryLoaded()) {
            addHistoryPage(historyRoot);
        }
    }

    function loadFullTrackers() {
        var trackersRoot = $("#third-cookies");
        while (!isTrackersLoaded()) {
            addTrackersPage(trackersRoot);
        }
    }

    function addHistoryPage(historyRoot) {
        for (; historyCnt < Math.min((historyPage + 1) * PAGE_SIZE, userHistory.length); historyCnt++) {

            var site = userHistory[historyCnt];
            var info = site2info[site];

            historyRoot.append(
                $('<tr>', {'class': SAFETY_CLS[info.safety]}).append($('<td><span class="color-circle"></span></td>').append(site)).append($('<td>', {'sorttable_customkey': info.last_visit}).text(formatDate(info.last_visit))).append($('<td>', {'sorttable_customkey': info.duration}).text(formatDuration(info.duration)))
            );
        }

        historyPage++;
    }

    var TYPE_ICONS = {
        'safe': 'verified_user',
        'personal': 'perm_identity',
        'malicious': 'warning',
        'unknown': 'info_outline'
    };

    function getTrackerCheckBoxListener(webBug, type) {
        return function () {
            var block = $(this).is(':checked');
            chrome.runtime.sendMessage({
                action: 'block-tracker',
                category: type.name,
                tracker: webBug.company.name,
                value: block ? 'block' : 'unblock'
            });

            if (!block) {
                var isCatBlocked = settings.isTypeBlocked(String(type.id));
                if (isCatBlocked) {
                    $(".block-trackers[data-type='" + type.name + "']").prop('checked', false);
                }
            }
        };
    }

    function addTrackersPage(siteCookiesRoot) {
        // console.log('~addTrackersPage~ safetyTypes:');
        // console.log(safetyTypes);

        for (; webBugsCnt < Math.min((webBugsPage + 1) * PAGE_SIZE, webBugs.length); webBugsCnt++) {

            var webBug = webBugs[webBugsCnt];
            // console.log(webBug);

            var type = getWebBugType(webBug.company.safety_type_id) || SAFETY_TYPE_UNKNOWN;

            var blockCheckbox = $('<input type="checkbox" id="item-' + webBugsCnt + '" data-type="' + type.name + '">').click(getTrackerCheckBoxListener(webBug, type));

            siteCookiesRoot.append(
                $('<tr>', {'class': type.name}).append($('<td><span class="color-circle"></span>').append(webBug.company.name)).append($('<td>', {
                    'class': "cookie-type",
                    'sorttable_customkey': type.name
                }).text(type.fullname).append(' <i class="material-icons">' + TYPE_ICONS[type.name] + '</i><span class="tooltip description">' + type.description + '</span>')).append($('<td>', {'sorttable_customkey': webBug.last_update}).text(formatDate(webBug.last_update))).append($('<td class="on-off" sorttable_customkey="0">').append(blockCheckbox).append('<label for="item-' + webBugsCnt + '"> \
                              <i class="material-icons"></i> \
                            </label>'
                    )
                )
            );

            var isCatBlocked = settings.isTypeBlocked(String(type.id || SAFETY_TYPE_UNKNOWN.id));

            if (isCatBlocked) {
                blockCheckbox.prop('checked', true);
            } else {
                // console.log(JSON.stringify(webBug) + " :: is blocked ::" + settings.isWebBugBlocked(webBug) + ', cat blocked: ' + isCatBlocked);
                if (settings.isWebBugBlocked(webBug)) {
                    blockCheckbox.prop('checked', true);
                }
            }
        }

        webBugsPage++;
    }


    function updateTrackerCounter(typeName, cnt) {
        $("#" + typeName + "-trackers").text(cnt);
        $("#tracker-table ." + typeName + " .badge").text(cnt);
    }

    function updateTrackerCounters() {
        var safe = 0, personal = 0, malicious = 0, unknown = 0;

        webBugs.forEach((webBug) => {
            var type = getWebBugType(webBug.company.safety_type_id);

            if (type.name == 'unknown') {
                unknown++;
            } else if (type.name == 'personal') {
                personal++;
            } else if (type.name == 'malicious') {
                malicious++;
            } else if (type.name == 'safe') {
                safe++;
            }

        });

        updateTrackerCounter('safe', safe);
        updateTrackerCounter('malicious', malicious);
        updateTrackerCounter('personal', personal);
        updateTrackerCounter('unknown', unknown);
    }

    function getWebBugType(typeId) {
        if (!typeId) {
            return SAFETY_TYPE_UNKNOWN;
        }

        return safetyTypes[typeId] || SAFETY_TYPE_UNKNOWN;
    }

    function formatDate(date) {
        return date ? moment(date).format('DD/MM/YY') : "???";
    }

    function formatDuration(duration) {
        return moment.duration(duration).format("HH:mm:ss", {trim: false})
    }

    /**********************************************************
     *
     *     Settings page handling
     *
     **********************************************************/

    $('.block-trackers').click(function () {
        let typeName = $(this).attr('data-type');
        var checked = $(this).is(':checked');

        $("#third-cookies input[type='checkbox'][data-type='" + typeName + "']").prop('checked', checked);

        chrome.runtime.sendMessage({
            action: 'change-settings',
            option: 'block-trackers',
            property: typeName,
            value: checked ? 'block' : 'unblock'
        });

        if (checked) {
            updateTrackerCounter(typeName, '0');
        }
    });

    $('.report-trackers').click(function () {
        var checked = $(this).is(':checked');

        chrome.runtime.sendMessage({
            action: 'change-settings',
            option: 'report-trackers',
            value: checked
        });

        setReportTracking(checked);
    });

    function setReportTracking(val) {
        if (val) {
            $('.report-trackers').prop('checked', true);
        } else {
            $('.report-trackers').removeAttr('checked');
        }
    }

    function updateSettings() {
        var blockedBugTypes = settings.getBlockedBugTypes();

        var thirdCookies = $("#third-cookies");

        blockedBugTypes.forEach((blocked_type_id)=> {
            var ct = safetyTypes[blocked_type_id];
            if (ct) {
                $(".block-trackers[data-type='" + ct.name + "']").prop('checked', true);
                $("input[data-type='" + ct.name + "']", thirdCookies).prop('checked', true);
            }
        });

        // Init Checkbox for anonymous tracking reporting.
        setReportTracking(settings.isReportTrackers());
    }

    /**********************************************************
     *
     *     Feedback Form
     *
     **********************************************************/

    function showModal(msg) {
        $("#modal-popup .modal-content").text(msg);
        $("#modal-popup").show();
    }

    $('#hide-modal').on('click', function () {
        $("#modal-popup").hide();
    });

    $('#btn-send-feedback').click(function () {
        var msg = $('#feedback-msg').val();
        var type = $('#feedback-type').val();

        if ($.trim(msg) == '') {
            showModal('Please provide some feedback.');
            $('#feedback-msg').focus();
            return;
        }
        if (!type) {
            showModal('Please choose type of your message.');
            $('#feedback-type').focus();
            return;
        }

        chrome.runtime.sendMessage({'action': 'send-feedback', msg: msg, type: type}, function (msg) {
            showModal(msg);
            $('#feedback-msg').val('');
        });
    });

    /**********************************************************
     *
     *     Get popup data from the background page
     *
     **********************************************************/

    function getUnknownType() {
        for (var type_id in safetyTypes) {
            var ct = safetyTypes[type_id];
            if (ct.name == 'unknown') {
                ct.id = type_id;
                return ct;
            }
        }
    }

    function prepareSafetyTypes(safetyTypes) {
        for (var type_id in safetyTypes) {
            safetyTypes[type_id].id = type_id;
        }

        return safetyTypes;
    }

    chrome.runtime.sendMessage({'action': 'get-profile-data'}, function (data) {
        //console.log("data: " + JSON.stringify(data));

        try {
            if ($.isEmptyObject(data.profile.st)) {
                $('#current-profile .sub-tab-section').hide();
                $('#current-profile .empty-profile').show();
            } else {
                renderStCharts(data.profile.st);
            }

            if ($.isEmptyObject(data.profile.lt)) {
                $('#long-term-profile .sub-tab-section').hide();
                $('#long-term-profile .empty-profile').show();
            } else {
                renderLtCharts(data.profile.lt);
            }

            userHistory = Object.keys(data.site2info);
            activityReport = data.activityReport;
            site2info = data.site2info;

            webBugs = data.webBugs;
            safetyTypes = prepareSafetyTypes(data.safetyTypes);

            SAFETY_TYPE_UNKNOWN = getUnknownType();

            updateTrackerCounters();

            $("#good-sites").text(String(data.good_sites));
            $("#bad-sites, #settings-history-badge").text(String(data.bad_sites));
            $("#history-table .badge").text(String(data.bad_sites));

            $("#neutral-sites").text(String(data.neutral_sites));

            if (data.bad_sites > 0) {
                $("#website-cookies").addClass('has-bad');
            }

            $("#total-number-site").text(String(userHistory.length));
            $("#total-number-thirdparty").text(String(webBugs.length));
            $(".noti-number-tot").text(String(userHistory.length + webBugs.length));

            loadFullHistory();
            // sorttable.makeSortable($("#history-table")[0]);
            $("#history-table th:eq(1)").click();

            loadFullTrackers();
            // sorttable.makeSortable($("#trackers-table")[0]);
            $("#trackers-table th:eq(2)").click();

            // addHistoryPage($("#site-cookies"));
            // addTrackersPage($("#third-cookies"));

            updateSettings();
        } catch (e) {
            $('#error').fadeIn('fast');
            localStorage['error_stack'] = e.stack;
        }
    });


    /**********************************************************
     *
     *     JR Additions
     *
     **********************************************************/

    $('.js-close-notice').click(function () {
        var id = $(this).attr('data-close');
        $('#' + id).fadeOut('fast');
        return false;
    });

    $('.js-open-notice').click(function () {
        var id = $(this).attr('data-open');
        $('#' + id).fadeIn('fast');
        return false;
    });

    $('.fixed-thead').scroll(function () {
        var top = $(this).scrollTop();
        $(this).find('thead').css('transform', 'translateY(' + top + 'px)');
    });


    $('.js-remove-item').click(function () {
        $(this).parents('tr').remove();
    });


    /**
     * jQuery function to prevent default anchor event and take the href * and the title to make a share pupup
     *
     * @param  {[object]} e           [Mouse event]
     * @param  {[integer]} intWidth   [Popup width defalut 500]
     * @param  {[integer]} intHeight  [Popup height defalut 400]
     * @param  {[boolean]} blnResize  [Is popup resizeabel default true]
     */
    $.fn.customPopup = function (e, intWidth, intHeight, blnResize) {

        // Prevent default anchor event
        e.preventDefault();

        // Set values for window
        var intWidth = intWidth || '500';
        var intHeight = intHeight || '400';
        var strResize = (blnResize ? 'yes' : 'no');

        // Set title and open popup with focus on it
        var strTitle = ((typeof this.attr('title') !== 'undefined') ? this.attr('title') : 'Social Share'),
            strParam = 'width=' + intWidth + ',height=' + intHeight + ',resizable=' + strResize,
            objWindow = window.open(this.attr('data-url'), strTitle, strParam).focus();
    }

    /* ================================================== */
    $('.share-icon').click(function (e) {
        $(this).customPopup(e);
    });

    $('.share-result-btn').click(function (e) {
        $(this).customPopup(e);
    });
}

try {
    init();
} catch (e) {
    $('#error').fadeIn('fast');
    localStorage['error_stack'] = e.stack;
}
