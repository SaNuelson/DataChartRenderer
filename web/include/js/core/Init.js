/* #region Init Static Methods */

// CRITICAL: Load JSON with chart type data
fetch('http://siret.ms.mff.cuni.cz/novelinka/new/web/json/graph_types.json')
    .then((data)=>data.json())
    .then((json)=>ChartManager.ChartTypeData = json)
    .catch((err)=>console.warn(err))

// CRITICAL: Set up Google Charts connection
google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });
google.charts.setOnLoadCallback(()=>{console.log("Google Charts loaded successfully.")});

/* #endregion */