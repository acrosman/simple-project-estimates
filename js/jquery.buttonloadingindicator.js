/**
 * Button loading indicator plugin
 * MIT License
 * Source: https://www.jqueryscript.net/loading/button-loading-indicator-font-awesome.html
 */

(function( $ ) {
 
    $.fn.startLoading = function() {
        return this.each(function() {
            $(this).attr("disabled", true).addClass("disabled");

            $icon = $(this).find('i');
            $icon.data('loader-icons', $icon.attr('class'))
            $icon.removeAttr('class');
            $icon.addClass("fa").addClass("fa-spin").addClass("fa-spinner");
        });
    }
 
    $.fn.stopLoading = function() {
        return this.each(function() {
            $(this).removeAttr("disabled").removeClass("disabled");
            
            $icon = $(this).find('i');
            $icon.removeAttr('class');
            $icon.attr('class', $icon.data('loader-icons'));
        });
    }
 
}( jQuery ));