/**
 * Layer legends often correspond a number with a description
 * with certain colors. When a user clicks on the map while using
 * the identify tool, a GetFeatureInfo request is made to MapServer
 * to get the pixel values for all active layers at the clicked point.
 * This file stores the legend descriptions associated with the pixel values
 * for all relevant layers, and has some functions for
 * managing and retrieving these descriptions.
 */

module.exports = function ($, app) {

  function isLayerInLegendConfig(layerId) {
    return layerId in app.legendLookup
  }

  function getLegendStringFromPixelValue(layerId, pixelValue) {
    var legendString = ''
    if (isLayerInLegendConfig(layerId)) {
      legendString = app.legendLookup[layerId][pixelValue]
      if (!legendString) {
        console.error('No legend string set for pixel value',
          pixelValue, 'for layer', layerId
        )
      }
    }
    return legendString
  }
  
  return getLegendStringFromPixelValue
}


