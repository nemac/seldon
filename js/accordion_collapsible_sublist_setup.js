module.exports = function ($) {
    function setupCollapsibleSublists () {
        var app = this;

        $('.ui-accordion-content h4').on('click', function (event) {
            var $this = $(this);
            if (app.currentTheme.label === 'Archived Near-Real-Time Change Maps (MODIS NDVI)' &&
                    $this.parent().parent().attr('id') === 'ui-accordion-layerPickerAccordion-panel-4') {
                $this.siblings('.layer-group').toggleClass('collapsed');
            }

        })

        /*
        var heightOfLayerDiv = $('.layer').outerHeight(true);
        var initialLessSublistHeightFactor = 10,
            heightIncFactor = 70,
            heightInc = heightOfLayerDiv * heightIncFactor,
            initialLessSublistHeight = heightOfLayerDiv * initialLessSublistHeightFactor + 'px',
            $collapsingSublists = $('.showLessSublist');

        $collapsingSublists.each(function () {
            var $layerCheckboxes = $(this).find(':checkbox');
            $layerCheckboxes.slice(0, initialLessSublistHeightFactor).attr('tabIndex', 0);
            $layerCheckboxes.slice(initialLessSublistHeightFactor).attr('tabIndex', -1);
        });

        
        $('.showLessSublist').css('height', initialLessSublistHeight);

        $('button.show-all-layers').on('click', function (event) {
            var $this = $(this),
                $sublist = $this.parent().siblings('.layer-group'),
                sublistScrollHeight = $sublist.prop('scrollHeight') + 'px';
            $this.removeClass('active').prop('disabled', true);
            $this.siblings('button.show-more-layers').removeClass('active').prop('disabled', true);
            $this.siblings('button.show-less-layers').addClass('active').prop('disabled', false);
            $sublist.css('height', sublistScrollHeight);
            $sublist.find(':checkbox').attr('tabIndex', 0);
        });

        $('button.show-more-layers').on('click', function (event) {
            var $this = $(this);
            var $sublist = $this.parent().siblings('.layer-group'),
                $layerCheckboxes = $sublist.find(':checkbox'),
                heightInPx = parseInt($sublist.css('height').slice(0,-2)),
                sublistScrollHeight = $sublist.prop('scrollHeight');

            if (heightInPx+heightInc > sublistScrollHeight) {
                $sublist.css('height', sublistScrollHeight);
                $this.removeClass('active').prop('disabled', true);
                $this.siblings('button.show-all-layers').removeClass('active').prop('disabled', true);
                $layerCheckboxes.attr('tabIndex', 0);
            } else {
                var newHeightInPx = parseInt($sublist.css('height').slice(0, -2)) + heightInc;
                var numVisibleCheckboxes = newHeightInPx / heightOfLayerDiv;
                $sublist.css('height', newHeightInPx + 'px');
                $this.siblings('button.show-less-layers').addClass('active').prop('disabled', false);
                $layerCheckboxes.slice(0, numVisibleCheckboxes).attr('tabIndex', 0);
                $layerCheckboxes.slice(numVisibleCheckboxes).attr('tabIndex', -1);
            }

        });

        $('button.show-less-layers').on('click', function (event) {
            var $this = $(this),
                $sublist = $this.parent().siblings('.layer-group'),
                $layerCheckboxes = $sublist.find(':checkbox');
            $sublist.css('height', initialLessSublistHeight);
            $this.removeClass('active').prop('disabled', true);
            $this.siblings('button.show-more-layers').addClass('active').prop('disabled', false);
            $this.siblings('button.show-all-layers').addClass('active').prop('disabled', false);
            $layerCheckboxes.slice(0, initialLessSublistHeightFactor).attr('tabIndex', 0);
            $layerCheckboxes.slice(initialLessSublistHeightFactor).attr('tabIndex', -1);
        });
        */
    }
    return setupCollapsibleSublists;
}