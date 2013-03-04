(function ($) {
    "use strict";

    var methods = {
        clearSections : function() {
            $(this).empty();
            $(this).data('listAccordion').sections = [];
            $(this).accordion('refresh');
        },

        addSection : function(title) {
            var sectionObj = {
                title          : title,
                titleElement   : $('<h3>' + title + '</h3>'),
                contentElement : $('<div></div>'),
                sublists    : []
            };
            $(this).data('listAccordion').sections.push(sectionObj);
            $(this) .
                append(sectionObj.titleElement) .
                append(sectionObj.contentElement);
            $(this).accordion('refresh');
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
                        accordionOptions     : options,
                        sections             : []
                    });
                    $this.accordion(options);
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
