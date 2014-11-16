/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

(function(Webvs) {

/**
 * @class
 * A components that saves or restores a copy of the current
 * frame buffer.
 *
 * @param {object} options - options object
 * @param {string} [options.action="SAVE"] - the action to be performed. viz. "SAVE",
 *     "RESTORE", "RESTORESAVE", "SAVERESTORE"
 * @param {number} [options.bufferId=1] - an identifying number for the buffer. This number
 *     is used to share buffer between different instances of BufferSave
 * @param {string} [options.blendMode="REPLACE"] - blending mode when restoring buffers
 * @constructor
 * @augments Webvs.Component
 * @memberof Webvs
 */
function BufferSave(gl, main, parent, opts) {
    BufferSave.super.constructor.call(this, gl, main, parent, opts);
}

Webvs.registerComponent(BufferSave, {
    name: "BufferSave",
    menu: "Misc"
});
    
var Actions = {
    "SAVE": 0,
    "RESTORE": 1,
    "SAVERESTORE": 2,
    "RESTORESAVE": 3
};
BufferSave.Actions = Actions;

Webvs.defineClass(BufferSave, Webvs.Component, {
    defaultOptions: {
        action: "SAVE",
        bufferId: "buffer1",
        blendMode: "REPLACE"
    },

    onChange: {
        "action": "updateAction",
        "bufferId": "updateBuffer",
        "blendMode": "updateBlendMode"
    },

    init: function() {
        this.updateAction();
        this.updateBlendMode();
        this.updateBuffer();
    },

    draw: function() {
        var fm = this.main.registerBank[this.bufferId];

        var currentAction;
        if(this.action == Actions.SAVERESTORE ||
           this.action == Actions.RESTORESAVE) {
            currentAction = this.nextAction;
            // toggle next action
            this.nextAction = (this.nextAction == Actions.SAVE)?Actions.RESTORE:Actions.SAVE;
        } else {
            currentAction = this.action;
        }

        var buffers = this.main.buffers;
        switch(currentAction) {
            case Actions.SAVE:
                buffers.setRenderTarget(this.opts.bufferId);
                this.main.copier.run(null, null, this.parent.fm.getCurrentTexture());
                buffers.restoreRenderTarget();
                break;
            case Actions.RESTORE:
                this.main.copier.run(this.parent.fm, this.blendMode, buffers.getTexture(this.opts.bufferId));
                break;
        }
    },

    destroy: function() {
        this.main.buffers.removeTexture(this.opts.bufferId);
    },
    
    updateAction: function() {
        this.action = Webvs.getEnumValue(this.opts.action, Actions);
        if(this.action == Actions.SAVERESTORE) {
            this.nextAction = Actions.SAVE;
        } else if(this.action == Actions.RESTORESAVE) {
            this.nextAction = Actions.RESTORE;
        }
    },

    updateBuffer: function(value, key, oldValue) {
        if(oldValue) {
            this.main.buffers.removeTexture(oldValue);
        }
        this.main.buffers.addTexture(this.opts.bufferId);
    },

    updateBlendMode: function() {
        this.blendMode = Webvs.getEnumValue(this.opts.blendMode, Webvs.BlendModes);
    }
});

})(Webvs);
