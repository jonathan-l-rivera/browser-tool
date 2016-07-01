/**
 * Created by Viktar Liaskovich on 27.06.2016.
 */

console.log('site.integration');

function sendExtensionEvent(initializer) {
    var element = document.getElementById("YBIDataElementId");

    initializer(element);

    var evt = document.createEvent("Events");
    evt.initEvent("YBIExtensionEvent", true, false);
    element.dispatchEvent(evt);
}

document.addEventListener('YBIExtensionEvent', function (e) {
    console.log('EVENT: ' + e.target.getAttribute('event'));

    switch (e.target.getAttribute('event')) {
        case 'Request::GetState':
            chrome.runtime.sendMessage({action : "get-app-state"}, function(state){
                console.log('state: ' + JSON.stringify(state));
                sendExtensionEvent(function(el){
                    el.setAttribute('event', 'Response::GetState');
                    el.setAttribute('data', JSON.stringify(state));
                });

            });
            break;
        case 'Request::GetData':
            chrome.runtime.sendMessage({action : "get-app-data"}, function(data){
                console.log('data: ' + JSON.stringify(data));

                sendExtensionEvent(function(el){
                    el.setAttribute('event', 'Response::GetData');
                    el.setAttribute('data', JSON.stringify(data));
                });
            });
            break;
    }
}, true);
console.log('CS listener added');
