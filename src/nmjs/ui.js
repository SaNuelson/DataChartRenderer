export function populateHeader(table, data) {
    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');
    data.forEach(d => header.append($('<th></th>').text(d)));
    thead.append(header);
    table.append(thead);
}

export function populateData(table, data, {
    fixedWidth = -1,
    fixedHeight = -1,
    convert = ((x) => {x}),
    noval = ""
} = {}) {

    let tbody = $('<tbody></tbody>');
    let height = fixedHeight > 0 ? fixedHeight : data.length;
    for (let i = 0; i < height; i++) {
        let row = $('<tr></tr>');
        let width = fixedWidth > 0 ? fixedWidth : data[i].length;
        for (let j = 0; j < width; j++) {
            let text = data[i][j] ? convert(data[i][j]) : noval;
            row.append('<td></td>').text(text);
        }
        tbody.append(row);
    }
    table.append(tbody);
}