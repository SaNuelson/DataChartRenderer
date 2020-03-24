$(() => {
    // csv sources on page
    $("a").each((idx, val) => {
        if (val.href.endsWith(".csv"))
            insertChartButtonAfter(val);
    })

    // chart-container settings
    $("#chart-container").resizable(
        {
            handles: "n,w,nw",
            containment: "document"
        });
})

function insertChartButtonAfter(element) {
    var insertElement = $("<img>")
        .attr("src", "https://img.icons8.com/wired/64/000000/graph.png")
        .addClass("csvLinkBtn")
        .click(() => { setSource(element.href) });

    $(element).after(insertElement);
}

// GCCSV
var csvData = null;

function setSource(srcUrl) {
    readCSV(srcUrl);
    loadDataPreview();
    loadChartOpts();
}

function readCSV(srcUrl) {
    var file = new XMLHttpRequest();
    file.open("GET", srcUrl, false);
    file.onreadystatechange = () => {
        if (file.readyState == 4) {
            if (file.status == 200 || file.status == 0) {
                csvData = new CSVData(file.responseText);
            }
        }
    }
    file.send(null);
}

function loadDataPreview(){
    let wrapper = document.getElementById('table-div');
    if(wrapper == null)
        return;
    let table = document.createElement('table');
	table.innerHTML = "";
	if(csvData == null)
		return;

	let table_head = table.createTHead();

	// insert head
	var table_head_row = table_head.insertRow();
	for(i = 0; i < csvData.head.length; i++){
		var table_head_cell = table_head_row.insertCell();
        table_head_cell.innerHTML = csvData.head[i];
	}

    // insert all data
    // console.log("Length: " + csvData.data.length);
    let table_body = table.createTBody();
    let upto = Math.min(csvData.data.length, 5);
	for(i = 0; i < upto; i++){
		let table_body_row = table_body.insertRow();
		for(j = 0; j < csvData.data[i].length; j++){
            let table_body_cell = table_body_row.insertCell();
            table_body_cell.innerHTML = csvData.data[i][j];
		}
    }
    wrapper.innerHTML = '';
    wrapper.appendChild(table);
}

function onGCLoaded() {}