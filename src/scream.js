var Scream,
    OCE = require('orientationchangeend')();
    
Scream = function Scream (config) {
    var scream;

    if (!(this instanceof Scream)) {
        return new Scream(config);
    }



    scream = this;

    config = config || {};

    config.width = config.width || {};

    if (!config.width.portrait) {
        config.width.portrait = global.screen.width;
    }

    if (!config.width.landscape) {
        config.width.landscape = global.screen.width;
    }

    /**
     * Viewport width relative to the device orientation.
     *
     * @return {Number}
     */
    scream.getViewportWidth = function () {
        return config.width[scream.getOrientation()];
    };

    /**
     * Viewport height relative to the device orientation and to scale with the viewport width.
     *
     * @return {Number}
     */
    scream.getViewportHeight = function () {
        return Math.round(scream.getScreenHeight() / scream.getScale());
    };

    /**
     * The ratio between screen width and viewport width.
     *
     * @return {Number}
     */
    scream.getScale = function () {
        return scream.getScreenWidth()/scream.getViewportWidth();
    };

    /**
     * @return {String} portrait|landscape
     */
    scream.getOrientation = function () {
        return global.orientation === 0 ? 'portrait' : 'landscape';
    };

    /**
     * Screen width relative to the device orientation.
     * 
     * @return {Number}
     */
    scream.getScreenWidth = function () {
        return global.screen[scream.getOrientation() === 'portrait' ? 'width' : 'height'];
    };

    /**
     * Screen width relative to the device orientation.
     * 
     * @return {Number}
     */
    scream.getScreenHeight = function () {
        return global.screen[scream.getOrientation() === 'portrait' ? 'height' : 'width'];
    };

    /**
     * Generates a viewport tag reflecting the content width relative to the device orientation
     * and scale required to fit the content in the viewport.
     *
     * Appends the tag to the document.head and removes the preceding additions.
     */
    scream._updateViewport = function () {
        var oldViewport,
            viewport,
            width,
            scale,
            content;

        width = scream.getViewportWidth();
        scale = scream.getScale();

        content = 
             'width=' + width +
            ', initial-scale=' + scale +
            ', minimum-scale=' + scale +
            ', maximum-scale=' + scale +
            ', user-scalable=0';
        
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = content;

        oldViewport = global.document.head.querySelector('meta[name="viewport"]');

        if (oldViewport) {
            oldViewport.parentNode.removeChild(oldViewport);
        }

        global.document.head.appendChild(viewport);
    };

    /**
     * Returns height of the usable viewport in the minimal view relative to the current viewport width.
     * 
     * @see http://stackoverflow.com/questions/26827822/how-is-the-window-innerheight-derived-of-the-minimal-view/26827842
     * @see http://stackoverflow.com/questions/26801943/how-to-get-the-window-size-of-fullscream-view-when-not-in-fullscream
     * @return {Number}
     */
    scream._getMinimalViewHeight = function () {
        var spec,
            i;

        if (scream.getOrientation() === 'portrait') {
            return scream.getViewportHeight();
        }

        spec = [
            // @see ./.spec/
            // [window.innerHeight when scale 0.25, screen.width, screen.height, devicePixelRatio, name]
            [1762, 320, 480, 2, 'iPhone 4'],
            [2114, 320, 568, 2, 'iPhone 5'],
            [2114, 320, 568, 2, 'iPhone 5s'],
            [2510, 327, 667, 2, 'iPhone 6'],
            [2785, 414, 736, 3, 'iPhone 6 plus'],
            [3936, 768, 1024, 1, 'iPad 2'],
            [3938, 768, 1024, 2, 'iPad Air'],
            [3938, 768, 1024, 2, 'iPad Retina']
        ];

        i = spec.length;

        while (i--) {
            if (global.screen.width === spec[i][1] && global.screen.width === spec[i][2] && global.devicePixelRatio === spec[i][3]) {
                return Math.round((scream.getViewportWidth() * spec[i][0]) / (spec[i][1] * 4));
            }
        }

        throw new Error('Not a known iOS device. If you are using an iOS device, report it to https://github.com/gajus/scream/issues/1.');
    };

    /**
     * Returns dimensions of the usable viewport in the minimal view relative to the current viewport width and orientation.
     * 
     * @return {Object} dimensions
     * @return {Number} dimensions.width
     * @return {Number} dimensions.height
     */
    scream.getMinimalViewSize = function () {
        var width = scream.getViewportWidth(),
            height = scream._getMinimalViewHeight();

        return {
            width: width,
            height: height
        };
    };

    /**
     * Returns true if screen is in "minimal" UI.
     *
     * iOS 8 has removed the minimal-ui viewport property.
     * Nevertheless, user can enter minimal-ui using touch-drag-down gesture.
     * This method is used to detect if user is in minimal-ui view.
     *
     * In case of orientation change, the state of the view can be accurately
     * determined only after orientationchangeend event.
     * 
     * @return {Boolean}
     */
    scream.isMinimalView = function () {
        // It is enough to check the height, because the viewport is based on width.
        return global.innerHeight == scream.getMinimalViewSize().height;
    };

    scream._updateViewport();

    OCE.on('orientationchangeend', scream._updateViewport);

    global.addEventListener('orientationchange', function () {
        scream._updateViewport();
    });

    // Scream is using `orientationchangeend` internally to set the viewport tag.
    // This is proxy for your convenience to perform operations that must follow
    // the change of the device orientation and in the context of updated viewport tag.
    scream.on = OCE.on;
};

global.gajus = global.gajus || {};
global.gajus.Scream = Scream;

module.exports = Scream;