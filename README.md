Data Chart Renderer
===

**DCR** is a JavaScript plugin used to parse CSV datasets, recognize its metadata and select (and render) the most appropriate and useful chart representations using the charting library [Chart.js](https://www.chartjs.org/).

#### Quick Reference

DCR is already implemented in 2 ways:
 - [DCR stand-alone web-page](https://github.com/SaNuelson/DataChartRenderer/tree/master/web/auto-page)
 - [DCR Chrome extension](https://github.com/SaNuelson/DataChartRenderer/tree/master/extension)

### File Structure

.
|
+- extension - contains files required to build DCR Chrome extension
+- src - contains internal module system which is the core of DCR (used in both modes)
+- web - contains a web-page related files which enable to run stand-alone web-page (which is deployed in Environments)

#### Thesis-regarded note

It is possible the DCR plug-in will be in further development after the submission of the thesis.

Due to this reason, a tag "thesis" has been created as well as appropriate release containing a zipped extension/ folder
to gain easy access to the state of the repository at the time of submitting my bachelor thesis.
