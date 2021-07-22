$('body').on('mouseenter', 'a[href$="csv"]', function(e) {
    previewLink(e.target);
    console.log("SHOW");
})

$('body').on('mouseleave', 'a[href$="csv"]', function(e) {
    hideLink();
})

Init({
onChartTemplatesLoaded: chartTemplatedLoadedHandler
});

function chartTemplatedLoadedHandler() {
console.log("Chart templates laoded.");
}

const previewHeight = 600;
const previewWidth = 600;

function previewLink(el) {
let pos = el.getBoundingClientRect();
let preview = getPreviewElement();
preview.style.top = pos.top - previewHeight + "px";
preview.style.left = pos.left + pos.width + "px";
preview.classList.remove('dcr-hidden');
populatePreviewElement(el.href);
}

function hideLink() {
let preview = getPreviewElement();
preview.classList.add('dcr-hidden');
}

let previewElement = undefined;
function getPreviewElement() {
if (!previewElement) {
    previewElement = document.createElement('div');
    previewElement.id = 'dcr-preview-div';
    previewElement.classList.add('dcr-preview-div');
    previewElement.classList.add('dcr-hidden');

    let mainCanvas = document.createElement('canvas');
    mainCanvas.id = 'dcr-preview-canvas';
    mainCanvas.setAttribute('width', previewWidth);
    mainCanvas.setAttribute('height', previewHeight);

    previewElement.appendChild(mainCanvas);
    document.body.appendChild(previewElement);
}
return previewElement;
}

function populatePreviewElement(url) {
let cat = new Catalogue();
cat.addEventListener('dataChanged', function() {
    cat.usetypes; // TODO: drawBinding should generate those automatically
    cat.bindings;
    console.log(cat);
    cat.setBindingElementId(0, 'dcr-preview-canvas');
    cat.drawBinding(0);
})
cat.loadFromUrl(url);
}