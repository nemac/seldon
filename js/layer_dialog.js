// This function gets called every time the layer properties icon gets clicked
module.exports = function ($) {

    function updateTransparency (layer, value) {
        try {
            layer.setTransparency(value);
        } catch (e) {
            var errTxt = e.message;
        }
    }

    function createLayerPropertiesDialog (layer) {
        var localTransparency = 0;
        var $html = $(''
                      + '<div class="layer-properties-dialog">'
                      +   '<table>'
                      +     '<tr>'
                      +       '<td>Transparency:</td>'
                      +       '<td>'
                      +         '<div class="transparency-slider"></div>'
                      +       '</td>'
                      +       '<td>'
                      +        '<input class="transparency-text" type="text" size="2"/>%'
                      +       '</td>'
                      +     '</tr>'
                      +   '</table>'
                      + '</div>'
                     );

        $html.find('input.transparency-text').val(layer.transparency);

        if (layer.transparency > 0) {
            localTransparency = layer.transparency;
            layer.setTransparency(localTransparency);
        }

        $html.find('.transparency-slider').slider({
            min   : 0,
            max   : 100,
            step  : 1,
            value : localTransparency,
            slide : function(event, ui) {
                updateTransparency(layer, ui.value)
            }
        });
        //This seems redundant as there is already a listener on the slider object
        //So, for now I will comment this out
        // layer.addListener("transparency", function (e) {
        // $html.find('.transparency-slider').slider("value", e.value);
        // });
        $html.find('input.transparency-text').change(function () {
            var $this = $(this),
                newValueFloat = parseFloat($this.val());
            if (isNaN(newValueFloat) || newValueFloat < 0 || newValueFloat > 100) {
                $this.val(layer.transparency);
                return;
            }
            layer.setTransparency($this.val());
        });

        layer.addListener("transparency", function (e) {
            $html.find('input.transparency-text').val(e.value);
        });

        //jdm 5/14/13: add listener for mask functionality
        //for every mask checkbox we check we getting a click event

        $html.dialog({
            zIndex    : 10050,
            position  : "left",
            autoOpen  : true,
            hide      : "explode",
            title     : layer.name,
            width     : 'auto',
            close     : function () {
                $(this).dialog('destroy');
                $html.remove();
                createLayerPropertiesDialog.$html[layer.lid] = undefined;
            }
        });
        createLayerPropertiesDialog.$html[layer.lid] = $html;
    } //end function createLayerPropertiesDialog (layer)

    // Object to be used as hash for tracking the $html objects created by createLayerPropertiesDialog;
    // keys are layer lids:
    createLayerPropertiesDialog.$html = {};

    return createLayerPropertiesDialog;
}

