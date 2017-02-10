/**
 * Layer legends often correspond a number with a description
 * with certain colors. When a user clicks on the map
 * while using the identify tool, a GetFeatureInfo request
 * is made to MapServer to get the pixel values
 * for all active layers at the clicked point.
 * This file stores the legend descriptions
 * associated with the pixel values for all
 * relevant layers, and has some functions for
 * managing and retrieving these descriptions
 */

module.exports = getLegendStringFromPixelValue

function isLayerInLegendConfig(layerId) {
  return layerId in legendConfig
}

function getLegendStringFromPixelValue(layerId, pixelValue) {
  var legendString = ''
  if (isLayerInLegendConfig(layerId)) {
    legendString = legendConfig[layerId][pixelValue]
    if (!legendString) {
      console.error('No legend string set for pixel value',
        pixelValue, 'for layer', layerId
      )
    }
    return legendString
  }
  return legendString
}





const legendConfig = {

  'landcover-2010-NALCMS': {
    '1': 'Temperate or sub-polar needleleaf forest',
    '3': 'Tropical or sub-tropical broadleaf evergreen forest',
    '5': 'Temperate or sub-polar broadleaf deciduous forest',
    '6': 'Mixed forest',
    '7': 'Tropical or sub-tropical shrubland',
    '8': 'Temperate or sub-polar shrubland',
    '9': 'Tropical or sub-tropical grassland',
    '10': 'Temperate or sub-polar grassland',
    '13': 'Sub-polar or polar barren-lichen-moss',
    '14': 'Wetland',
    '15': 'Cropland',
    '16': 'Barren land',
    '17': 'Urban and built-up',
    '18': 'Water',
    '19': 'Snow and ice'
  }

}

