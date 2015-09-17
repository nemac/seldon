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


## Masks

A toggle for a mask may be defined in HTML in the following way.

```
<input class="mask-toggle" type="checkbox" name="Wetland" id="Wetland" 
        value="MaskForWetland"/>
<label for="Wetland">Show Only: Wetland</label>
```

The `mask-toggle` class is required. The `value` attribute must be the id of the input tag prepended with `MaskFor`.

#### Submasks

To specify a submask, use the `data-mask-grouper` and `data-mask-parent` attributes on the respective parent and child masks' input tags. The `data-mask-parent` attribute must be the contents of the parent masks's `value` attribute.

```
<input class="mask-toggle" data-mask-grouper=true type="checkbox" 
        name="Forest" id="Forest" value="MaskForForest"/>
<label for="Forest">Mask: Forest Only</label>
<br>
<input class="mask-toggle" data-mask-parent="MaskForForest" type="checkbox" 
        name="Rainforest" id="Rainforest" value="MaskForRainforest"/>
<label for="RainForest">Forest Submask: Rainforest Only</label>
```