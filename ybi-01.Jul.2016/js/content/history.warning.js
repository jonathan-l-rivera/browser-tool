var MS_IN_DAY = 86400000;
var TIME_TO_MILLIS = {
    "1d": 1 * MS_IN_DAY,
    "3d": 3 * MS_IN_DAY,
    "1w": 7 * MS_IN_DAY,
    "2w": 2 * 7 * MS_IN_DAY,
    "1m": 30 * MS_IN_DAY
};

function showOverlay() {
    var iframe = $('<div class="bt-overlay">  \
		<iframe class="bt-notification framed" id="questionable"> \
		</iframe> \
		</div> \
        ');

    var content = '<div class="frame" id="questionable-1"> \
				<div class="inner-content"> \
					<p>You are about to enter a website that is deemed questionable based on our records. Do you wish to continue?</p> \
					<button class="guide-btn guide-btn-main js-go-to-frame" data-target="#questionable-2")">Yes, Proceed</button> \
					<button id="bt-btn-away" class="guide-btn guide-btn">No, Take me back</button> \
				</div> \
			</div> \
			<div class="frame off-right" id="questionable-2"> \
				<div class="inner-content"> \
					<p>Skip this warning for  \
						<select id="warning-delay" name="warning"> \
							<option value="1d">1 day</option> \
							<option value="3d">3 days</option> \
							<option value="1w">1 week</option> \
							<option value="2w">2 weeks</option> \
							<option value="1m">1 month</option> \
						</select> \
					</p> \
					<p> \
						<button id="skip-warning" class="guide-btn guide-btn-main" data-close="questionable">Apply</button> \
						<button id="close-popup" class="guide-btn" data-close="questionable">Don\'t skip</button> \
					</p> \
					<aside> \
						<a id="report-site" href="#">This is a safe site, send report.</a> \
					</aside> \
				</div> \
			</div>';

    $("body").append($("<style>").text(CSS_FRAME)).append(iframe);
    $('#questionable').on('load', function () {
        console.log('LOADED');
        var win = this.contentWindow;
        var doc = win.document;

        doc.close();
        doc.open();
        doc.write([
            content,
            "<style>" + CSS + "</style>",
            "<script src='" + chrome.extension.getURL('js/lib/jquery-2.1.4.min.js') + "'></script>",
            "<script>" + (internalScripts.toString().replace('function internalScripts()', '')) + "</script>"
        ].join('\n'));
        doc.close();
    }).attr("src", "about:blank");

    function handleIframeMessage(msg) {
        if (msg.action == "skip-warning") {
            localStorage['skip-warning-for'] = msg.delay;
            localStorage['visited-date'] = new Date().getTime();

            iframe.remove();
        } else if (msg.action == "report-site") {
            chrome.runtime.sendMessage(msg);

            alert("Thank you for the report. We will review this site.");

            iframe.remove();
        } else if (msg.action == "proceed-the-site" || msg.action == "left-the-site") {
            chrome.runtime.sendMessage(msg);

            if (msg.action != "left-the-site") {
                iframe.remove();
            }
        }
    }

    window.addEventListener("message", function (e) {
        if (e.origin == document.origin) {
            handleIframeMessage(e.data);
        }
    }, false);
}

function internalScripts() {
    $("#bt-btn-proceed, #close-popup").click(function () {
        window.parent.postMessage({action: "proceed-the-site"}, "*");
    });
    $("#skip-warning").click(function () {
        window.parent.postMessage({action: "skip-warning", delay: $('#warning-delay').val()}, "*");
    });
    $("#bt-btn-away").click(function () {
        window.parent.postMessage({action: "left-the-site"}, "*");
    });
    $("#report-site").click(function (e) {
        window.parent.postMessage({action: "report-site"}, "*");
        e.preventDefault();
    });

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
}

function waitFor(condition, delay, func) {
    if (!condition()) {
        setTimeout(function () {
            waitFor(condition, delay, func);
        }, delay);
    } else {
        func();
    }
}

var CSS_FRAME = ".bt-overlay{\
        position:fixed;\
        top:0;\
        left:0;\
        z-index:2147483647;\
        opacity:0.95;\
        background-color:white;\
        width:100%;\
        height:100%\
    } \
	.bt-notification { \
		width: 500px; \
		max-width: 500px; \
		margin: 0px auto; \
        margin-top: 10%; \
        display: block; \
		padding: 20px; \
		background: rgba(0, 0, 0, 0.75); \
		z-index: 2147483648; \
		border-radius: 10px; \
		border: none; \
	}\
	\
	.bt-notification.framed { \
		min-width: 500px; \
		min-height: 200px; \
	}";

var FONT_DIR = chrome.extension.getURL('popup/font/');

var CSS = "\
    @font-face { \
        font-family:'Roboto'; \
        src:local(Roboto Regular),url(" + FONT_DIR + "roboto/Roboto-Regular.eot); \
        src:url(" + FONT_DIR + "roboto/Roboto-Regular.eot?#iefix) format('embedded-opentype'),url(" + FONT_DIR + "roboto/Roboto-Regular.ttf) format('truetype'); \
        font-weight:400; \
    } \
    @font-face { \
        font-family:'Roboto'; \
        src:url(" + FONT_DIR + "roboto/Roboto-Bold.eot); \
        src:url(" + FONT_DIR + "roboto/Roboto-Bold.eot?#iefix) format('embedded-opentype'),url(" + FONT_DIR + "roboto/Roboto-Bold.woff2) format('woff2'),url(" + FONT_DIR + "roboto/Roboto-Bold.woff) format('woff'),url(" + FONT_DIR + "roboto/Roboto-Bold.ttf) format('truetype'); \
        font-weight:700; \
    }\
    body {\
    	color: #fff; \
    	font-family: Roboto,sans-serif;\
		text-align: center; \
		overflow: hidden; \
    }\
    p{ \
		font-size: 15px; \
	} \
	.frame { \
		position: absolute; \
		display: flex; \
		flex-direction: column; \
		align-content: center; \
		justify-content: center; \
		left: 0; \
		top: 0; \
		width: 100%; \
		height: 100%; \
		box-sizing: border-box; \
		padding: 20px; \
	} \
	aside { \
		font-size: 12px; \
	} \
	aside a { \
		color: #fff; \
		text-decoration: underline; \
		font-weight: bold; \
	} \
	.frame { \
		transition:all .3s ease; \
		transform:translateX(0); \
	} \
	.off-right { \
		transform:translateX(100%); \
	} \
	.off-left { \
		transform:translateX(-100%); \
	}";

function canShow() {
    var skipFor = localStorage['skip-warning-for'];

    if (!skipFor) {
        return true;
    }
    var inMillis = TIME_TO_MILLIS[skipFor];

    var lastVisit = localStorage['visited-date'];
    if (!lastVisit) {
        return true;
    }
    lastVisit = parseInt(lastVisit);

    return new Date().getTime() - lastVisit > inMillis;
}

if (canShow()) {
    waitFor(function () {
        return document.body && window.$
    }, 10, function () {
        showOverlay()
    });
}
