$(() => {
    $('#popup-div').append($('<ul id="popup-list"></ul>'));
    setTimeout(onPopupTimeout, PopupTimeout);
})

document.log = message => showPopup(message, 0);
document.warn = message => showPopup(message, 1);
document.err = message => showPopup(message, 2);

const MaxPopups = 5;
const PopupTimeout = 30000;

let popups = [];

document.log = message => showPopup(message, 0);
document.warn = message => showPopup(message, 1);
document.err = message => showPopup(message, 2);

// CONSOLE.LOG EXTENSION
if (false) {
    let warn = console.warn;
    let error = console.error;
    let err = console.err;
    console.warn = function (msg) {
        document.warn(msg);
        warn(msg);
    }
    console.error = function (msg) {
        document.err(msg);
        error(msg);
    }
    console.err = function(msg) {
        document.err(msg);
        err(msg);
    }
}

showPopup = function (message, type) {
    popups.push(getPopup(message, type));
    tryAddPopupItem();
}

getPopup = function (message, type) {
    let typeClass;
    switch (type) {
        case 0:
            typeClass = 'info';
            break;
        case 1:
            typeClass = 'warning';
            break;
        case 2:
            typeClass = 'error';
            break;
    }

    return $(`
    <li>
        <div class="container popup ${typeClass}">
            <div class="row">
                <div class="col-3 m-auto">
                    <img src="img/${typeClass}-icon.png" />
                </div>
                <div class="col-9">
                    <h4>${typeClass[0].toUpperCase() + typeClass.slice(1)}</h4>
                    <p>${message}</p>
                </div>
            </div>
        </div>
    </li>`)
        .on('click', function () { tryRemovePopupItem($(this)) });
}

onPopupTimeout = function () {
    tryRemovePopupItem();
    setTimeout(onPopupTimeout, PopupTimeout);
}

onPopupCreation = function () {
    tryAddPopupItem();
}

tryRemovePopupItem = function (item) {
    if (!item)
        item = $('#popup-list li:first');
    if ($('#popup-list').children().length > 0)
        item.fadeOut(500, function () {
            $(this).remove();
            tryAddPopupItem();
        });

}

tryAddPopupItem = function () {
    if (popups.length > 0 && $('#popup-list').children().length < MaxPopups) {
        $('#popup-list')
            .append(popups[0]
                .css('position', 'relative')
                .css('left', '500px')
                .animate({ 'left': '0' }, 400, function () {
                    $(this).removeAttr('style');
                }));
        popups = popups.slice(1);
    }
}