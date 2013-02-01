(function ($) {
    "use strict";

    var methods = {

        getAreaExtent : function(areaName,areasList) {
            var areaExtent   = {
                left   : -15000000,  
                bottom : 2000000,     
                right  : -6000000,   
                top    : 7000000     
            };         
            var test = "areaName";
            var filteredArrayObject = [],
                i;
            for (i = 0; i < areas.length; i++) {
                if (areas[i].areaName === areaName) {
                    filteredArrayObject.push(areas[i]);
                }
            }
            areaExtent.left = filteredArrayObject[0].areaXMin;
            areaExtent.bottom = filteredArrayObject[0].areaYMin;
            areaExtent.right = filteredArrayObject[0].areaXMax;
            areaExtent.top = filteredArrayObject[0].areaYMax;
            return areaExtent;
        },    

        getAreasList : function() {
            var areasList = [];
            for (var i = 0; i < areas.length; i++) {
                areasList.push(areas[i].areaName);
            }              
            return areasList;
        },
        
        init : function(options) {
            return this.each(function() {
                var $this = $(this),
                    data = $this.data('findArea');
                if ( ! data ) {
                    $this.data('findArea', {
                        accordionOptions : options,
                        sections         : []
                    });
                }
                return this;
            });
        }
    };

    $.fn.findArea = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.findArea' );
            return null;
        }    
    };
    
}(jQuery));
