module.exports = function ($) {
    var createSplashScreen = require("./splash.js")($);

    var areasList = [];
    var activeBtn = [];

    function launch (configFile, shareUrlInfo) {
        var deactivateActiveOpenLayersControls = require("./deactivate_controls.js")(this, activeBtn);
        var printMap = require("./print.js")($, this);

        var app = this;

        var $configXML;

        $.ajax({
            url: configFile,
            dataType: "xml",
            success: function (configXML) {
                $configXML = app.parseConfig(configXML, shareUrlInfo);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(textStatus);
            }
        });

        //
        // layerPicker button:
        //
        $("#btnTglLyrPick").click(function () {
            var $layerPickerDialog = $("#layerPickerDialog");
            if ($layerPickerDialog.dialog('isOpen')) {
                $layerPickerDialog.dialog('close');
            } else {
                $layerPickerDialog.dialog('open');
            }
        });

        //
        // turn layerPickerDialog div into a jQuery UI dialog:
        //
        $("#layerPickerDialog").dialog({
            zIndex   : 10050,
            position : { my: "left top", at: "left+5 top+100" },
            autoOpen : true,
            hide     : "fade"
        });

        app.addListener("accordiongroupchange", function () {
            if (app.currentTheme) {
                $('#layerPickerAccordion').accordion({
                        active      : app.currentTheme.getAccordionGroupIndex(app.currentAccordionGroup),
                        collapsible : true
                });
            }
        });

        //
        // mapTools button:
        //
        $("#btnTglMapTools").click(function () {
            var $mapToolsDialog = $("#mapToolsDialog");
            if ($mapToolsDialog.dialog('isOpen')) {
                $mapToolsDialog.dialog('close');
            } else {
                $mapToolsDialog.dialog('open');
            }
        });

        //
        // turn mapToolsDialog div into a jQuery UI dialog:
        //
        $("#mapToolsDialog").dialog({
            zIndex   : 10050,
            position : { my: "right top", at: "right-5 top+100" },
            autoOpen : true,
            hide     : "fade"
        });
        app.addListener("themechange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("baselayerchange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("accordiongroupchange", function () {
            app.updateShareMapUrl();
        });
        app.addListener("extentchange", function () {
            app.saveCurrentExtent();
            app.updateShareMapUrl();
            //jdm 4/28/15: removed this as it seem to be throwing things off
			//when panning outside of current view extent.  Instead moved it to the bottom of 
			//setTheme because that is where a change such as switching to the Alaska theme 
			//can be caught.  However, in general it shouldn't be necessary to be updating the 
			//maxExtent within the CONUS which will be the case 99% of the time
			// app.map.setOptions({maxExtent: app.map.getExtent()});
        });

        //
        // mapTools accordion
        //
        var $mapToolsAccordion = $("#mapToolsAccordion"),
            accordionGroupIndexToOpen = 0;

        //    initialize
        $mapToolsAccordion.accordion({
            heightStyle : 'content',
            collapsible : true
        });

        //    find the 'legend' layer in the mapTools accordion, and make sure it is initially turned on
        $mapToolsAccordion.find('div').each(function (i) {
            if (this.id === "legend") {
                accordionGroupIndexToOpen = i;
                return false;
            }
            return true;
        });
        $mapToolsAccordion.accordion('option', 'active', accordionGroupIndexToOpen);

        //
        // base layer combo change handler
        //
        $('#baseCombo').change(function () {
            var i = parseInt($(this).val(), 10);
            app.setBaseLayer(app.baseLayers[i]);
        });
        app.addListener("baselayerchange", function () {
            $('#baseCombo').val(app.currentBaseLayer.index);
        });

        //
        // theme layer combo change handler
        //
        $('#themeCombo').change(function () {
            var i = parseInt($(this).val(), 10);
            app.setTheme(app.themes[i]);
			//jdm (4/28/15) moved to here to account for possibility of 
			//significant extent change with theme change
			app.map.setOptions({maxExtent: app.map.getExtent()});			
        });
        app.addListener("themechange", function () {
            $('#themeCombo').val(app.currentTheme.index);
        });

        //
        // pan button
        //
        $("#btnPan").click(function () {
            deactivateActiveOpenLayersControls();
            app.dragPanTool.activate();
        });

        //
        // print button
        //
        $("#btnPrint").click(function () {
            if ($configXML !== undefined) {
                printMap($configXML);
            } else {
                console.log("Can't print yet; config file not yet parsed");
            }
        });

        //
        // zoom in button
        //
        $("#btnZoomIn").click(function () {
            deactivateActiveOpenLayersControls();
            app.zoomInTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // zoom out button
        //
        $("#btnZoomOut").click(function () {
            deactivateActiveOpenLayersControls();
            app.zoomOutTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // zoom to full extent button
        //
        $("#btnZoomExtent").click(function () {
            app.zoomToExtent(app.maxExtent);
        });

        //
        // identify button
        //
        $("#btnID").click(function () {
            deactivateActiveOpenLayersControls();
            app.identifyTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // about button
        //
        $("#btnAbout").click(function () {
            // I don't think the following line is needed. but am leaving it in
            // just in case - jrf
            //                deactivateActiveOpenLayersControls();
            var splashScreen = $("#splashScreenContainer");
            if (splashScreen.dialog("isOpen")) {
                splashScreen.dialog("close");
            } else {
                splashScreen.dialog("open");
            }
        });

        //
        // previous extent button
        //
        $("#btnPrev").click(function () {
            app.zoomToPreviousExtent();
        });

        //
        // next extent button
        //
        $("#btnNext").click(function () {
            app.zoomToNextExtent();
        });

        //
        // multigraph button
        //
        $("#btnMultiGraph").click(function () {
            deactivateActiveOpenLayersControls();
            app.multigraphTool.activate();
            activeBtn = $(this);
            activeBtn.children().addClass('icon-active');
        });

        //
        // splash screen
        //
        createSplashScreen();

        //Find Area
        var $findArea = $('#findArea');
        $findArea.findArea();
        areasList = $findArea.findArea('getAreasList');
        $findArea.autocomplete({
            source: areasList
        });
        $findArea.keypress(function (e) {
            if (e.which == 13) {
                var areaExtent = $findArea.findArea('getAreaExtent', $findArea.val(), areasList);
                app.zoomToExtent(areaExtent);
            }
        });

        //jdm: 7/9/12 - for global mask functionality
        $('.mask-toggle').on('click', function () {
            if ($(this).is(':checked')) {
                //console.log("setMaskByMask at line 789");
                app.setMaskByMask(true, this.value);
            } else {
                app.setMaskByMask(false, this.value);
            }
        });

        $('textarea').focus(function () {
            var $this = $(this);

            $this.select();

            // webkit issue
            window.setTimeout(function () {
                $this.select();
            }, 1);

            function mouseUpHandler () {
                // Prevent further mouseup intervention
                $this.off("mouseup", mouseUpHandler);
                return false;
            }

            $this.mouseup(mouseUpHandler);
        });

        // closes accordion tools by default on small browsers
        if ($(window).width() < 650) {
            $('#mapToolsDialog').dialog('close');
            $('#layerPickerDialog').dialog('close');
        }

        // closes and reopens accordion tools on mobile devices. They tend to lose their proper
        // position otherwise.
        if (window.addEventListener) {
            window.addEventListener("orientationchange", function () {
                var $mapToolsDialog    = $('#mapToolsDialog'),
                    $layerPickerDialog = $('#layerPickerDialog');

                window.scroll(0, 0);
                if ($mapToolsDialog.dialog('isOpen')) {
                    $mapToolsDialog.dialog('close').dialog('open');
                }

                if ($layerPickerDialog.dialog('isOpen')) {
                    $layerPickerDialog.dialog('close').dialog('open');
                }
            }, false);
        }

    };

    return launch;
}
