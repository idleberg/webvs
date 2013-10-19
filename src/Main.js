/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * Main Webvs object, that represents a running webvs instance.
 * @memberof Webvs
 * @param {object} options - options object
 * @constructor
 */
function Main(options) {
    Webvs.checkRequiredOptions(options, ["canvas", "analyser"]);
    options = _.defaults(options, {
        showStat: false
    });
    this.canvas = options.canvas;
    this.analyser = options.analyser;
    if(options.showStat) {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '5px';
        stats.domElement.style.bottom = '5px';
        document.body.appendChild(stats.domElement);
        this.stats = stats;
    }
    this._initGl();
}
Webvs.Main = Webvs.defineClass(Main, Object, {
    _initGl: function() {
        try {
            this.gl = this.canvas.getContext("experimental-webgl", {alpha: false});

            this.copier = new Webvs.CopyProgram({dynamicBlend: true});
            this.copier.init(this.gl);

            this.resolution = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        } catch(e) {
            throw new Error("Couldnt get webgl context" + e);
        }
    },

    /**
     * Loads a preset JSON. If a preset is already loaded and running, then
     * the animation is stopped, and the new preset is loaded.
     * @param {object} preset - JSON representation of the preset
     * @memberof Webvs.Main
     */
    loadPreset: function(preset) {
        var newRoot = new Webvs.EffectList(preset);
        this.stop();
        this.preset = preset;
        if(this.rootComponent) {
            this.rootComponent.destroy();
        }
        this.rootComponent = newRoot;
    },

    /**
     * Reset all the components. Call this when canvas dimensions changes
     * @memberof Webvs.Main
     */
    resetCanvas: function() {
        this.stop();
        if(this.rootComponent) {
            this.rootComponent.destroy();
            this.rootComponent = null;
        }
        this._initGl();
        if(this.preset) {
            this.rootComponent = new EffectList(this.preset);
        }
    },

    /**
     * Starts the animation
     * @memberof Webvs.Main
     */
    start: function() {
        if(!this.rootComponent) {
            return; // no preset loaded yet. cannot start!
        }

        this.registerBank = {};
        this.bootTime = (new Date()).getTime();
        var rootComponent = this.rootComponent;
        var promise = rootComponent.init(this.gl, this);

        var that = this;
        var drawFrame = function() {
            if(that.analyser.isPlaying()) {
                rootComponent.update();
            }
            that.animReqId = requestAnimationFrame(drawFrame);
        };

        // wrap drawframe in stats collection if required
        if(this.stats) {
            var oldDrawFrame = drawFrame;
            drawFrame = function() {
                that.stats.begin();
                oldDrawFrame.call(this, arguments);
                that.stats.end();
            };
        }

        // start rendering when the promise is  done
        promise.onResolve(function() {
            that.animReqId = requestAnimationFrame(drawFrame);
        });
    },

    /**
     * Stops the animation
     * @memberof Webvs.Main
     */
    stop: function() {
        if(typeof this.animReqId !== "undefined") {
            cancelAnimationFrame(this.animReqId);
        }
    }
});

Main.ui = {
    leaf: false,
    disp: "Main",
    schema: {
        name: {
            type: "string",
            title: "Name"
        },
        author: {
            type: "string",
            title: "Author"
        },
        description: {
            type: "string",
            title: "Description"
        },
        clearFrame: {
            type: "boolean",
            title: "Clear every frame",
            default: false,
            required: true
        }
    },
};

})(Webvs);



