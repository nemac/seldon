Seldon
=======

Foundation for OpenLayers GIS viewer.

In order to build the project you will need node, npm, browserify and uglify-js.

Once node and npm are installed you should install browserify and uglify-js by running the following commands.

```
npm install -g browserify
npm install -g uglify-js
```

After the dependencies have been installed you can build seldon.js by running the `do-build` script or by hand with the following commands at the root level.

```
browserify js/seldon.js -o seldon.js
uglifyjs < seldon.js > seldon-min.js
```
