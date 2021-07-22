// Popup communication
let enabled = true;
let limit = 5000;
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "dcr-enable") {
            enabled = true;
        }
        else if (request.message === "dcr-disable") {
            enabled = false;
        }
    }
);

chrome.runtime.onMessage.addListener(function(req){
    if (req.message === "bg-dcr-enable") {
        enabled = true;
        if (req.limit)
            limit = req.limit;
    }
    else if (req.message === "bg-dcr-disable") {
        enabled = false;
    }
})

let linkExceptions = [];
$('body').on('mouseenter', 'a[href*=".csv"]', function (e) {
    if (!enabled)
        return;

    let target = e.target;
    if (target.tagName !== "A") {
        if (target.parentElement.tagName === "A")
            target = target.parentElement;
        else
            return;
    }
    if (target.href.toLowerCase().endsWith('.csv') && target.id !== 'dcr-preview-open')
        onLinkSelected(target);
    fetch(target.href)
        .then(res => {
            if (!linkExceptions.includes(target.href) && res.headers.get('content-type') === 'text/csv')
                onLinkSelected(target);
            else
                linkExceptions.push(target.href);
        })
        .catch(() => { });
});

$('body').on('mouseleave', 'a[href*=".csv"]', function (e) {
    onLinkDeselected();
});


Init({
    onChartTemplatesLoaded: chartTemplatedLoadedHandler
});

function chartTemplatedLoadedHandler() {
    console.log("Chart templates laoded.");
}

function onLinkSelected(el) {
    let entry = cache.create(el, (entry) => popup.showChart(entry.id, 0));
    if (entry.state === "loading")
        popup.showLoading(entry.id);
}

function onLinkDeselected() {
    setTimeout(() => popup.hide(), 200);
}

const cache = {
    _memory: {},
    _idCtr: 0,
    _getId() { return this._idCtr++; },
    getById(id) { for (let key in this._memory) if (this._memory[key].id == id) return this._memory[key]; },
    _active: undefined,
    getActive() {
        return _active;
    },
    setActive(entry) {
        this._active = entry;
    },
    create(el, cb) {
        let url = el.href;
        let pos = el.getBoundingClientRect();
        if (this._memory[url]) {
            if (cb) cb(this._memory[url]);
            return this._memory[url];
        }

        let entry = {};
        entry.state = "loading";
        let catalogue = new Catalogue();
        catalogue.addEventListener('dataChanged', function () {
            console.log("CATALOGUE(", url, ") =>", catalogue.bindings.length);
            if (cb) cb(entry);
            entry.state = "loaded";
        });
        console.log("Papaparse read from url ", url);
        setTimeout(() => catalogue.loadFromUrl(url), 100); // necessary to show loading screen for large files

        entry.url = url;
        entry.cat = catalogue;
        entry.canvases = [];
        entry.id = this._getId();
        entry.pos = pos;
        this._memory[url] = entry;
        return entry;
    }
};

const popup = {
    _width: 600,
    _height: 600,
    _footerHeight: 30,
    _hovered: false,
    _padding: 20,
    _activeSet: [-1, -1],
    _html: undefined,
    _label: undefined,
    _infoLabel: undefined,
    _openBtn: undefined,
    _canvases: [],
    _activeCanvas: undefined,
    showAt(x, y, bounded = false) {
        if (bounded) {
            if (x < window.scrollX + this._padding)
                x = window.scrollX + this._padding;
            if (y < window.scrollY + this._padding)
                y = window.scrollY + this._padding;
            if (x + this._width > window.innerWidth + window.scrollX - this._padding)
                x = window.innerWidth + window.scrollX - this._padding - this._width;
            if (y + this._height > window.innerHeight + window.scrollY - this._padding)
                y = window.innerHeight + window.scrollY - this._padding - this._height;
        }
        this._html.css({ 'top': y, 'left': x }).show();
    },
    hide() {
        if (!this._hovered)
            this._html.hide();
    },
    show() {
        this._html.show();
    },
    showChart(ci, bi) {
        console.log("Show chart");
        let elId = 'dcr-' + ci + '-' + bi;

        if (this._activeCanvas)
            this._activeCanvas.hide();
        let entry = cache.getById(ci);
        let catalogue = entry.cat;
        let pos = entry.pos;
        if (catalogue.bindings.length <= bi) {
            console.error("Catalogue doesn't have enough charts.", catalogue.bindings.length, bi);
            this._showMode("info", "No compatible charts found");
            this.show();
            return;
        }
        if (!catalogue.bindings[bi].boundElementId) {
            let newCanvas = $('<canvas></canvas>')
                .addClass('dcr-preview-canvas')
                .prop('id', elId)
                .css({ width: this._width + 'px', height: this._height - this._footerHeight + 'px' })
                .appendTo(this._html);
            catalogue.setBindingElementId(bi, elId);
            catalogue.drawBinding(bi);
            this._activeCanvas = newCanvas;
            this._canvases.push(newCanvas);
        }
        else {
            this._activeCanvas = $('#' + elId);
        }
        this._showMode("chart");
        this._activeSet = [ci, bi];
        this._label.text((+bi + 1) + '/' + catalogue.bindings.length);
        this._openBtn.attr('href',
            "https://sanuelson.github.io/DataChartRenderer/web/auto-page/index.html?src=" +
            cache.getById(popup._activeSet[0]).url);

        this.showAt(pos.x + window.scrollX + pos.width, pos.y + window.scrollY - this._height, true);
    },
    showPrev() {
        console.log("Show prev");
        let [ci, bi] = this._activeSet;
        let catalogue = cache.getById(ci).cat;
        if (bi === 0)
            bi = catalogue.bindings.length - 1;
        else
            bi--;
        this._activeSet = [ci, bi];
        this._label.text((+bi + 1) + '/' + catalogue.bindings.length);
        this.showChart(ci, bi);
    },
    showNext() {
        console.log("Show next");
        let [ci, bi] = this._activeSet;
        let catalogue = cache.getById(ci).cat;
        if (bi === catalogue.bindings.length - 1)
            bi = 0;
        else
            bi++;
        this._activeSet = [ci, bi];
        this._label.text((+bi + 1) + '/' + catalogue.bindings.length);
        this.showChart(ci, bi);
    },
    showLoading(ci) {
        console.log("Show loading");
        if (ci === undefined)
            ci = this._activeSet[0];
        let entry = cache.getById(ci);
        let pos = entry.pos;
        this._showMode("info", "Loading ...");
        if (this._activeCanvas)
            this._activeCanvas.hide();
        this._activeCanvas = undefined;
        this.showAt(pos.x + window.scrollX + pos.width, pos.y + window.scrollY - this._height, true);
    },
    _showMode(mode, msg) {
        this._infoLabel.hide();
        if (this._activeCanvas)
            this._activeCanvas.hide();
        if (mode === "info")
            this._infoLabel.show().text(msg);
        else if (mode === "chart")
            if (this._activeCanvas)
                this._activeCanvas.show();
    }
};

(function constructPopupWindow() {
    let prevBtn = $('<input type="button" value="Prev"></input>')
        .on('click', function () { popup.showLoading(); popup.showPrev() });

    let label = $('<div></div>')
        .text('NaN/NaN');

    let infoLabel = $('<div></div>')
        .hide()
        .addClass('dcr-preview-label');

    let nextBtn = $('<input type="button" value="Next"></input>')
        .on('click', function () { popup.showLoading(); popup.showNext() });

    let openBtn = $('<a>Open</a>')
        .prop('id','dcr-preview-open');

    let menu = $('<div></div>')
        .addClass('dcr-preview-footer')
        .append(prevBtn)
        .append(label)
        .append(nextBtn)
        .append(openBtn);

    let popupWrapper = $('<div></div>')
        .addClass('dcr-preview-div')
        .css({ 'width': this._width, 'height': this._height })
        .hide()
        .on('mouseenter', () => { popup._hovered = true; })
        .on('mouseleave', () => { popup._hovered = false; onLinkDeselected(); })
        .appendTo($('body'))
        .append(infoLabel)
        .append(menu);

    popup._html = popupWrapper;
    popup._label = label;
    popup._infoLabel = infoLabel;
    popup._openBtn = openBtn;
})()