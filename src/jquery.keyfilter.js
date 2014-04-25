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
        var KEYS, KEYS_RANGE;

        KEYS = {
            BACKSPACE: 8,
            TAB:       9,
            RETURN:    13,
            ESC:       27,
            SHIFT:     16,
            CTRL:      17,
            ALT:       18
        }

        KEYS_RANGE = {
            SPECIALS: [18, 20],
            NAV:      [33, 40]
        };

        function extractCharCode(event) {
            if (event.which !== 0 && !event.ctrlKey && !event.altKey && !event.metaKey) {
                return event.which;
            }

            return null;
        }

        function isSymbolCode(code) {
            var test;

            test = true;
            test = test && code !== KEYS.BACKSPACE;
            test = test && code !== KEYS.TAB;
            test = test && code !== KEYS.RETURN;
            test = test && code !== KEYS.ESC;
            test = test && code !== KEYS.SHIFT;
            test = test && code !== KEYS.CTRL;
            test = test && code !== KEYS.ALT;
            test = test && (code < KEYS_RANGE.SPECIALS[0] || code > KEYS_RANGE.SPECIALS[1]);
            test = test && (code < KEYS_RANGE.NAV[0] || code > KEYS_RANGE.NAV[1]);

            return test;
        }

        return {
            constructor: Filter,

            initialize: function(options) {
                $.extend(true, this.options, options);
            },

            filter: function($event) {
                var code, symbol, filter, regexp, length, test = true;

                if ((code = extractCharCode($event)) && isSymbolCode(code)) {
                    symbol = String.fromCharCode(code)

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
                        $event.preventDefault();
                    }

                    return test;
                }

                return true;
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
        events: ["keypress"]
    };

    Filter.eventNamespace = 'keyfilter';
    Filter.dataKey        = 'keyfilter';

    // Plugin initialization
    // ---------------------

    var old = $.fn.keyfilter;

    $.fn.keyfilter = function(options) {
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

    $.fn.keyfilter.noConflict = function() {
        $.fn.keyfilter = old;
    };


    return Filter;
});