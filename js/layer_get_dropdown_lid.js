function getActiveDropdownBoxRadioLID (app) {
    var selectLayer = app.dropdownBoxLayers[$(app.dropdownBoxList[0]).find(":selected").val()];
    var i;

    if (selectLayer) {
        var wanted_lid = selectLayer.lid;
    } else {
        return null;
    }

    for (i = 0; i < app.radioButtonList.length; i++) {
        if (app.radioButtonList[i].checked) {
            wanted_lid = app.radioButtonLayers[i].lid + wanted_lid;
        }
    }
    return wanted_lid;
}

module.exports = getActiveDropdownBoxRadioLID;
