module.exports = function ($) {
    function setupCollapsibleSublists () {

        var heightOfLayerDiv = $('.layer').outerHeight(true);
        var initialLessSublistHeightFactor = 10,
            heightIncFactor = 30,
            heightInc = heightOfLayerDiv * heightIncFactor,
            initialLessSublistHeight = heightOfLayerDiv * initialLessSublistHeightFactor + 'px';
        
        $('.showLessSublist').css('height', initialLessSublistHeight);

        $('button.show-all-layers').on('click', function (event) {
            var $this = $(this),
                $sublist = $this.parent().siblings('.layer-group'),
                sublistScrollHeight = $sublist.prop('scrollHeight') + 'px';
            $this.removeClass('active').prop('disabled', true);
            $this.siblings('button.show-more-layers').removeClass('active').prop('disabled', true);
            $this.siblings('button.show-less-layers').addClass('active').prop('disabled', false);
            $sublist.css('height', sublistScrollHeight);
        });

        $('button.show-more-layers').on('click', function (event) {
            var $this = $(this);
                $this.blur();
            var $sublist = $this.parent().siblings('.layer-group'),
                heightInPx = parseInt($sublist.css('height').slice(0,-2)),
                scrollHeightInPx = $sublist.prop('scrollHeight');

            if (heightInPx+heightInc > scrollHeightInPx) {
                $sublist.css('height', sublistScrollHeight);
                $this.removeClass('active').prop('disabled', true);
                $this.siblings('button.show-all-layers').removeClass('active').prop('disabled', true);
            } else {
                $sublist.css('height', '+='+heightInc);
                $this.siblings('button.show-less-layers').addClass('active').prop('disabled', false);
            }

        });

        $('button.show-less-layers').on('click', function (event) {
            var $this = $(this);
            $this.parent().siblings('.layer-group').css('height', initialLessSublistHeight);
            $this.removeClass('active').prop('disabled', true);
            $this.siblings('button.show-more-layers').addClass('active').prop('disabled', false);
            $this.siblings('button.show-all-layers').addClass('active').prop('disabled', false);
        });
    }

    return setupCollapsibleSublists;
}