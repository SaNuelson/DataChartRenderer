var graph_types_path = function() { return "C:/Users/sanue/Desktop/Year Project Repo/JsOnlySite/json/graph_types.json";}

var graph_types = undefined;
function loadGraphTypes(){
    if(graph_types != undefined)
        return graph_types;

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
        graph_types = JSON.parse(xmlhttp.responseText);
        }
    };
    xmlhttp.open("GET",graph_types_path,true);
    xmlhttp.send();
}