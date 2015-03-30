module.exports = function ($) {
    function updateShareMapUrl () {
        if (this.currentTheme) {
            var url = this.shareUrl();
            if (url) {
                $('#mapToolsDialog textarea.shareMapUrl').val(url);
            }
        }
    }

    return updateShareMapUrl;
}
