!function(factory) {

    var isNode, isAMD,
        jQuery;

    isNode = typeof module !== "undefined" && module.exports;
    isAMD = typeof define === "function" && define.amd && typeof define.amd === "object";

    if (isNode) {
        jQuery = require("jquery");
        module.exports = factory(jQuery);
    } else if (isAMD) {
        define(['jquery'], function(jQuery) {
            return factory(jQuery);
        });
    } else {
        factory(root.jQuery);
    }

}(function($) {

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) == '[object Function]';
    }

    function isObject(obj) {
        return Object.prototype.toString.call(obj) == '[object Object]';
    }

    function isString(obj) {
        return Object.prototype.toString.call(obj) == '[object String]';
    }

    function isNumber(obj) {
        return Object.prototype.toString.call(obj) == '[object Number]';
    }

    function isRegExp(obj) {
        return Object.prototype.toString.call(obj) == '[object RegExp]';
    }

    var Filter = function(element, options) {
        this.element  = element;
        this.$element = $(element);
        this.options  = $.extend(true, {}, Filter.DEFAULTS, options);

        this.events = $.map(this.options.events, function(event) {return [event, Filter.eventNamespace].join('.')}).join(' ');
    };

    Filter.prototype = (function() {
        function extractCharCode(event) {
            if (event.which !== 0 && event.keyCode !== 0 && !event.ctrlKey && !event.altKey && !event.metaKey) {
                return event.keyCode || event.charCode;
            }

            return null;
        }

        return {
            constructor: Filter,

            initialize: function(options) {
                $.extend(true, this.options, options);
            },

            filter: function(event) {
                var code, symbol, filter, regexp, length, test = true;

                if (code = extractCharCode(event)) {
                    symbol = String.fromCharCode(code);

                    if (test && isRegExp(regexp = this.options.regexp)) {
                        test = test && regexp.test(symbol);
                        if (regexp.global) {
                            regexp.lastIndex = 0;
                        }
                    }

                    if (test && isFunction(filter = this.options.filter)) {
                        test = test && filter.call(null, symbol, this.element);
                    }

                    if (!test) {
                        event.preventDefault();
                    }

                    return test;
                }

                return false;
            },

            restart: function() {
                this.stop();
                this.start();
            },

            start: function() {
                this.$element.on(this.events, $.proxy(this.filter, this));
            },

            stop: function() {
                this.$element.off(this.events);
            }
        };
    })();

    Filter.DEFAULTS = {
        regexp: null,
        filter: null,
        events: ["keypress", "keyup"]
    };

    Filter.eventNamespace = 'keyFilter';
    Filter.dataKey        = 'keyFilter';

    // Plugin initialization
    // ---------------------

    var old = $.fn.keyFilter;

    $.fn.keyFilter = function(options) {
        var method;

        if (isString(options)) {
            method  = options;
            options = null;
        } else if (isObject(options)) {
            method = null;
        } else {
            return $(this);
        }

        return $(this).each(function() {
            var filter = $(this).data(Filter.dataKey);

            if (options) {
                if (!filter) {
                    filter = new Filter(this, options);
                    $(this).data(Filter.dataKey, filter);
                } else {
                    filter.initialize(options);
                }
                filter.restart();
            } else if (method && filter) {
                isFunction(filter[method]) && filter[method].call(filter);
            }
        });
    };

    $.fn.keyFilter.noConflict = function() {
        $.fn.keyFilter = old;
    };


    return Filter;
});