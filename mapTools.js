(function ($) {
    "use strict";

    var methods = {
        addAccordionGroup : function(title) {
            var g = {
                title          : title,
                titleElement   : $('<h3>' + title + '</h3>'),
                contentElement : $('<div></div>'),
                subHeadings    : []
            };
            $(this).data('mapTools').accordionGroups.push(g);
            $(this) .
                append(g.titleElement) .
                append(g.contentElement) .
                accordion('destroy') .
                accordion();
            return g;
        },

        addAccordionGroupSubHeadingLayer : function (s, items) {
            var contents = $('<div class="mapTool"></div>');
            $.each(items, function() {
                contents.append(this);
            });
            var layer = {
                name : name,
                contentElement : contents
            };
            s.layers.push(layer);
            s.contentElement.append(layer.contentElement);
        },

        addAccordionGroupSubHeading : function (g, heading) {
            var s = {
                heading : heading,
                layers : [],
                contentElement : $('<div><h4>' + heading + '</h4></div>')
            };
            g.subHeadings.push(s);
            $(g.contentElement).append(s.contentElement);
            return s;
        },
        
        getAccordionGroupTitles : function() {
            var i, titles = [];
            for (i=0; i<$(this).data('mapTools').accordionGroups.length; ++i) {
                titles.push($(this).data('mapTools').accordionGroups[i].title);
            }
            return titles;
        },

        init : function(options) {
            return this.each(function() {
                var $this = $(this),
                    data = $this.data('mapTools'),
                    settings = $.extend({
                        // defaults go here
                    }, options);
                if ( ! data ) {

                    $this.data('mapTools', {
                        accordionGroups : []
                    });

                    //$this.accordion();
                }

                return this;
            });
        }
    };

    $.fn.mapTools = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.mapTools' );
            return null;
        }    
    };
    
}(jQuery));
