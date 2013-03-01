(function ($) {
    "use strict";

    var methods = {
        addSection : function(title) {
            var sectionObj = {
                title          : title,
                titleElement   : $('<h3>' + title + '</h3>'),
                contentElement : $('<div></div>'),
                sublists    : []
            };
            $(this).data('listAccordion').sections.push(sectionObj);
            if ($(this).data('accordion')) {
                $(this).accordion('destroy');
            }
            $(this) .
                append(sectionObj.titleElement) .
                append(sectionObj.contentElement) .
                accordion($(this).data('listAccordion').accordionOptions);
            return sectionObj;
        },

        addSublist : function (g, heading) {
            var sublistObj = {
                heading : heading,
                items : [],
                contentElement : $('<div><h4>' + heading + '</h4></div>')
            };
            g.sublists.push(sublistObj);
            $(g.contentElement).append(sublistObj.contentElement);
            return sublistObj;
        },
        
        addSublistItem : function (s, items) {
            var contents = $('<div class="layer"></div>');
            $.each(items, function() {
                contents.append(this);
            });
            var layer = {
                name : name,
                contentElement : contents
            };
            s.items.push(layer);
            s.contentElement.append(layer.contentElement);
        },

        getSectionTitles : function() {
            var i, titles = [];
            for (i=0; i<$(this).data('listAccordion').sections.length; ++i) {
                titles.push($(this).data('listAccordion').sections[i].title);
            }
            return titles;
        },

        init : function(options) {
            return this.each(function() {
                var $this = $(this),
                    data = $this.data('listAccordion');
                if ( ! data ) {

                    $this.data('listAccordion', {
                        accordionOptions : options,
                        sections         : []
                    });

                    //$this.accordion();
                }

                return this;
            });
        }
    };

    $.fn.listAccordion = function( method ) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.listAccordion' );
            return null;
        }    
    };
    
}(jQuery));
