
let enabled = true;
let toggleBtn = document.getElementById('on-off-btn');
let limitInput = document.getElementById('limit-input');
toggleBtn.addEventListener('click', function (e) {
    if (enabled) {
        toggleBtn.setAttribute('value', 'Enable');
        enabled = false;
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "message": "stop" });
        });
    }
    else {
        toggleBtn.setAttribute('value', 'Disable');
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "message": "start" });
        });
    }
});
limitInput.addEventListener('change', function (e) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "limit", "value": limitInput.value});
       });
})