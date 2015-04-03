function getActiveDropdownBoxRadioLID (app) {
    var wanted_lid = undefined;
    var selectLayer = undefined;
    var i;

    for (i = 0; i < app.dropdownBoxList[0].length; i++) {
        if (app.dropdownBoxList[0][i].selected) {
            selectLayer = app.dropdownBoxLayers[app.dropdownBoxList[0].selectedIndex];
            wanted_lid = selectLayer.lid;
        }
    }
    for (i = 0; i < app.radioButtonList.length; i++) {
        if (app.radioButtonList[i].checked) {
            wanted_lid = app.radioButtonLayers[i].lid+wanted_lid;
        }
    }
    return wanted_lid;
}

module.exports = getActiveDropdownBoxRadioLID;
