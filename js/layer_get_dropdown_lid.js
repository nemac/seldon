function getActiveDropdownBoxRadioLID (app) {
    var selectLayer = app.dropdownBoxLayers[$(app.dropdownBoxList[0]).find(":selected").val()];
    var wanted_lid = selectLayer.lid;
    var i;

    for (i = 0; i < app.radioButtonList.length; i++) {
        if (app.radioButtonList[i].checked) {
            wanted_lid = app.radioButtonLayers[i].lid + wanted_lid;
        }
    }
    return wanted_lid;
}

module.exports = getActiveDropdownBoxRadioLID;
