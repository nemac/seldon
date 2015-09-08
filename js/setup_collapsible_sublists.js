module.exports = function ($) {
    function setupCollapsibleSublists () {

        var heightOfLayerDiv = $('.layer').outerHeight(true),
            heightIncFactor = 30,
            heightInc = heightOfLayerDiv * heightIncFactor,
            initialLessSublistHeightFactor = 10,
            initialLessSublistHeight = heightOfLayerDiv * initialLessSublistHeightFactor + 'px';

        $('.showLessSublist').css('height', initialLessSublistHeight);

        $('button.show-all-layers').on('click', function (event) {
            var $this = $(this),
                $sublist = $this.parent().siblings('.layer-group'),
                sublistScrollHeight = $sublist.prop('scrollHeight') + 'px';
            $this.prop('disabled', true);
            $this.siblings('button.show-more-layers').prop('disabled', true);
            $this.siblings('button.show-less-layers').prop('disabled', false);
            $sublist.css('height', sublistScrollHeight);
        });

        $('button.show-more-layers').on('click', function (event) {
            var $this = $(this),
                $sublist = $this.parent().siblings('.layer-group'),
                heightInPx = parseInt($sublist.css('height').slice(0,-2)),
                scrollHeightInPx = $sublist.prop('scrollHeight');
            if (heightInPx+heightInc > scrollHeightInPx) {
                $sublist.css('height', sublistScrollHeight);
                $this.prop('disabled', true);
                $this.siblings('button.show-all-layers').prop('disabled', true);
            } else {
                $sublist.css('height', '+='+heightInc);
                $this.siblings('button.show-less-layers').prop('disabled', false);
            }
        });

        $('button.show-less-layers').on('click', function (event) {
            var $this = $(this);
            $this.parent().siblings('.layer-group').css('height', initialLessSublistHeight);
            $this.prop('disabled', true);
            $this.siblings('button.show-more-layers').prop('disabled', false);
            $this.siblings('button.show-all-layers').prop('disabled', false);
        });
    }

    return setupCollapsibleSublists;
}