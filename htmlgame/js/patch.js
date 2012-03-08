// Patching layerX and layerY bug to circumvent breakage due to
// webkit (and forthcoming mozilla) deprecation. Code from:
// http://stackoverflow.com/questions/7825448/webkit-issues-with-event-layerx-and-event-layery
// http://bugs.jquery.com/ticket/10531
(function($){
    var all = $.event.props,
        len = all.length,
        res = []
    ;
    while (len--) {
        var el = all[len];
        if (el != 'layerX' && el != 'layerY') res.push(el);
    }
    $.event.props = res;
}(jQuery));


// Add easing function
(function($){
    $.extend($.easing, {
        easeInSine: function (x, t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        }
    });
}(jQuery));