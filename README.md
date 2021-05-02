Data Chart Renderer
===

- is first and foremost still in dev as a bachelor's thesis and therefore undertakes heavy changes frequently.
- is a pure JS plugin, which is able to render data as charts using Google Charts API.
- aims to offer multiple levels of complexity for the user to take advantage of, on one hand giving almost full control over the core, on the other offering an API that's as simple as "Give me data, I'll give chart back. Don't like it? I'll give you another.".

Usage
===
This repository includes a several examples on "gh-pages" currently available [here](https://sanuelson.github.io/DataChartRenderer/)

It can be either used as an ES6 module version from the /src folder, or you can compile yourself a minified JS (with your chosen functionality level) by cloning this repo and running
```
npm install
npm run build
```
with npm installed. This will generate minified JS files in /dist directory. Multiple build scripts are on their way which will result in different levels of functionality.

Whats & Whys
===
DCR is purely client-sided. While I admit this is not the most efficient solution due to possible size of input data, it's important to note Google Charts works purely on client as well and generates the charts directly using SVG and dynamic HTML, so the only way to make this server-sided would either be taking snapshots from a virtual HTML renderer or sending exclusively data between user and server which seems even less efficient.

DCR is, let's admit it, currently extremely bloated, containing multitude of classes and lots of unnecessary code. While true, this is to keep the code as readable and modifiable as possible, as I was already forced once to undertake a complete refactoring as the simplistic and straight-forward approach I took resulted in code that was hell to read and expand upon. After all, this project is not meant for wide usage (at least not in its current state), and it should be fairly easy to use tree shaking and other methods to make it acceptably large with regards to its fairly limited functionality. On top of that, this enables me to make it something more in near future, as it already contains non-trivial parsers.

Functionality & Composition
===
In its current state (as of 1.5.2021), the whole module follows a tree-like structure:
 - BindingManager
   - not currently implemented
 - ChartManager
   - stands on top of the hierarchy, used for direct communication with user
   - offers self-explanatory methods such as
     - ChartManager.fromUrl(url)
     - ChartManager.fromRaw(data)
     - manager.setContainer(id)
     - manager.setType(chartType)
     - manager.draw(forced)
   - along with some less important ones.
 - SourceData
   - glorified data wrapper, can be used directly without ChartManager
   - currently also handles parsing and recognizing contained data
   - this functionality is ought to be split, as SourceData can be used without recognizing, by directly providing expected data types and formats when prompting the GoogleChart-compatible format.
 - Usetype
   - base class inherited by specific Usetypes which correspond to GoogleChart's 