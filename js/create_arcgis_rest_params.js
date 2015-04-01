module.exports = function ($) {
    function createArcGIS93RestParams ($layer) {
        //  $layer is a jQuery object corresponding to a <restLayer> section in the config file.
        //  For example:
        //
        //    <restLayer
        //      name="Climate Wizard"
        //      url="http://www.climatewizard.org:6080/ArcGIS/rest/services/ClimateWizard/US/ImageServer/exportImage/exportImage"
        //      legend="yaya-placeholder.png"
        //      lid="CC9999"
        //      visible="true">
        //        <param name="noData" value="0" />
        //        <param name="format" value="png" />
        //        <param name="interpolation" value="RSP_NearestNeighbor" />
        //        <param name="transparent" value="true" />
        //        <param name="mosaicRule">
        //            <param name="mosaicMethod" value="esriMosaicAttribute" />
        //            <param name="where" value="Name = 'm_ensemble_50_a2_pptPct_14_2040_2069'" />
        //            <param name="sortField" value="Name" />
        //        </param>
        //        <param name="imageSR" value="102100" />
        //        <param name="bboxSR" value="102100" />
        //        <param name="f" value="json" />
        //    </restLayer>
        //
        //  This function constructs and returns a (nested) JS Object corresponding
        //  to the <param> subelements.
        var obj = {};
        $layer.find('>param').each(function(i, param) {
            var $param = $(param);
            if (param.hasAttribute('value')) {
                obj[$param.attr('name')] = $param.attr('value');
            } else {
                obj[$param.attr('name')] = createArcGIS93RestParams($param);
            }
        });
        return obj;
    }

    return createArcGIS93RestParams;
}
