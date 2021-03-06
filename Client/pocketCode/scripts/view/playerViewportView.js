﻿/// <reference path="../core.js" />
/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-core.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../../../smartJs/sj-ui.js" />
/// <reference path="../ui/canvas.js" />
'use strict';

PocketCode.Ui.PlayerViewportView = (function () {
    PlayerViewportView.extends(SmartJs.Ui.Control, false);

    //ctr
    function PlayerViewportView() {

        SmartJs.Ui.Control.call(this, 'div', { className: 'pc-playerViewportView' });
        this._dom.dir = 'ltr';  //canvas text positions are always ltr

        this._originalWidth = 200;  //default: until set
        this._originalHeight = 380;
        this.__resizeLocked = false;
        this._axesVisible = false;
        this._activeAskDialog = undefined;

        this._canvas = new PocketCode.Ui.Canvas();
        this._appendChild(this._canvas);

        //rendering
        this._redrawRequired = false;
        SmartJs.AnimationFrame.addEventListener(new SmartJs.Event.EventListener(this._redrawCanvas, this));
        if (PocketCode.I18nProvider)
            PocketCode.I18nProvider.onLanguageChange.addEventListener(new SmartJs.Event.EventListener(this._onLanguageChangeHandler, this));

        this._onResize.addEventListener(new SmartJs.Event.EventListener(function () {
            window.setTimeout(this._updateCanvasSize.bind(this), 120);
        }, this));

        //canvas events
        this._onUserAction = new SmartJs.Event.Event(this);
        this._canvas.onRenderingSpriteTouched.addEventListener(new SmartJs.Event.EventListener(function (e) {
            this._onUserAction.dispatchEvent(e.merge({ action: PocketCode.UserActionType.SPRITE_TOUCHED }));
        }, this));
        this._canvas.onTouchStart.addEventListener(new SmartJs.Event.EventListener(function (e) {
            this._onUserAction.dispatchEvent(e.merge({ action: PocketCode.UserActionType.TOUCH_START }));
        }, this));
        this._canvas.onTouchMove.addEventListener(new SmartJs.Event.EventListener(function (e) {
            this._onUserAction.dispatchEvent(e.merge({ action: PocketCode.UserActionType.TOUCH_MOVE }));
        }, this));
        this._canvas.onTouchEnd.addEventListener(new SmartJs.Event.EventListener(function (e) {
            this._onUserAction.dispatchEvent(e.merge({ action: PocketCode.UserActionType.TOUCH_END }));
        }, this));
    }

    // events
    Object.defineProperties(PlayerViewportView.prototype, {
        onUserAction: {
            get: function () {
                return this._onUserAction;
            }
        },
    });

    //properties
    Object.defineProperties(PlayerViewportView.prototype, {
        _mobileResizeLocked: {  //to keep the original viewport size when the mobile keyboard shows up
            set: function (bool) {
                if (!SmartJs.Device.isMobile)
                    return; //mobile only
                if (typeof bool != 'boolean')
                    throw new Error('invalid parameter: setter: resizeLocked');
                if (this.__resizeLocked == bool)
                    return;

                this.__resizeLocked = bool;
                if (bool) {
                    var canvas = this._canvas;
                    canvas.style.width = canvas.width + 'px';
                    canvas.style.height = canvas.height + 'px';

                    SmartJs.Ui.Window.onResize.addEventListener(new SmartJs.Event.EventListener(this._windowOrientationChangeHandler, this));
                }
                else {
                    this.style.width = '100%';
                    this.style.height = '100%';

                    SmartJs.Ui.Window.onResize.removeEventListener(new SmartJs.Event.EventListener(this._windowOrientationChangeHandler, this));
                }
            },
        },
        axisVisible: {
            get: function () {
                return this._axesVisible;
            },
        },
        renderingSprites: {
            set: function (value) {
                this._canvas.renderingSprites = value;
            },
        },
        renderingTexts: {
            set: function (value) {
                this._canvas.renderingTexts = value;
            },
        },
    });

    //methods
    PlayerViewportView.prototype.merge({
        _windowOrientationChangeHandler: function (e) {
            var canvas = this._canvas;
            canvas.style.left = Math.floor((e.width - canvas.width) * 0.5) + 'px';
        },
        _updateCanvasSize: function () {
            if (this.__resizeLocked)
                return;
            var w = this.width,
                h = this.height,
                ow = this._originalWidth,
                oh = this._originalHeight,
                scaling;

            if (!w || !h || !ow || !oh) //any =0 values
                return;
            if (oh / ow >= h / w)   //aligned top/bottom
                scaling = h / oh;
            else
                scaling = w / ow;   //aligned left/right


            //size = even int number: without white border (background visible due to sub-pixel rendering)
            var canvas = this._canvas,
                cw = Math.ceil(ow * scaling * 0.5) * 2.0,
                ch = Math.ceil(oh * scaling * 0.5) * 2.0;
            canvas.setDimensions(cw, ch, scaling, scaling);
            //canvas.style.margin = 'auto'
            if (SmartJs.Device.isMobile) {  //canvas != viewport
                canvas.style.left = Math.floor((w - cw) * 0.5) + 'px';  //including border
                canvas.style.top = Math.floor((h - ch) * 0.5) + 'px';
            }

            this.render();
            this._drawAxes();
        },
        setOriginalViewportSize: function (width, height) {
            this._originalWidth = width;
            this._originalHeight = height;
            this._updateCanvasSize();
        },
        //ask
        showAskDialog: function (question, callback) {
            var dialog = new PocketCode.Ui.AskDialog(question);
            this._activeAskDialog = dialog;
            dialog.onSubmit.addEventListener(new SmartJs.Event.EventListener(function (e) {
                e.target.dispose();
                if (SmartJs.Device.isMobile) {
                    this._mobileResizeLocked = false;
                }
                callback(e.answer);
            }, this));

            if (SmartJs.Device.isMobile) {
                window.setTimeout(function () {
                    this._appendChild(dialog);
                    this._updateCanvasSize();
                    this._mobileResizeLocked = true;
                    dialog.focusInputField();
                }.bind(this), 500); //wait before show to make sure the UI gets time to update during two calls (hide/show online keyboard)
            }
            else {
                this._appendChild(dialog);
                dialog.focusInputField();
            }
        },
        hideAskDialog: function (){
            var dialog = this._activeAskDialog;
            if (dialog)
                dialog.dispose();
            this._activeAskDialog = undefined;
        },
        //pen, stamp
        initScene: function (id, screenSize, reinit) {
            this._canvas.initScene(id, screenSize);
            if (reinit)
                this._canvas.clearCurrentPenStampCache();

            this.render();
        },
        drawStamp: function (spriteId) {
            this._canvas.drawStamp(spriteId);
        },
        movePen: function (spriteId, toX, toY) {
            this._canvas.movePen(spriteId, toX, toY);
        },
        clearCurrentPenStampCache: function () {
            this._canvas.clearCurrentPenStampCache();
        },
        clear: function () {
            this.hideAskDialog();
            this._canvas.clearPenStampCache();
        },
        //camera
        updateCameraUse: function (cameraOn, cameraStream) {    //TODO: params, ...
            //console.log("camera stream in view:", cameraStream);
            this._canvas.cameraStream = cameraStream;
            this._canvas.cameraOn = cameraOn;
        },
        //axes
        showAxes: function () {
            if (this._axesVisible)
                return;
            this._axesVisible = true;
            this._drawAxes();
        },
        hideAxes: function () {
            if (!this._axesVisible)
                return;
            this._axesVisible = false;
            this._clearAxes();
        },
        _drawAxes: function () {
            if (!this._axesVisible)
                return;

            var ctx = this._canvas.contextTop,
                    width = this._canvas.width,
                    height = this._canvas.height,
                    color = 'red',
                    pixelRatio = 1;

            ctx.save();

            ctx.beginPath();
            ctx.moveTo(Math.round(width * 0.5), 0);   //avoid sub pixel rendering
            ctx.lineTo(Math.round(width * 0.5), height);

            ctx.moveTo(0, Math.round(height * 0.5));
            ctx.lineTo(width, Math.round(height * 0.5));

            ctx.strokeStyle = color;
            ctx.lineWidth = pixelRatio;
            ctx.font = (12 * pixelRatio) + 'px Arial';
            ctx.fillStyle = color;
            //center
            ctx.fillText('0', width * 0.5 + 5, height * 0.5 + 15);
            //width
            ctx.fillText('-' + this._originalWidth * 0.5, 5, height * 0.5 + 15);
            ctx.fillText(this._originalWidth * 0.5, width - 25, height * 0.5 + 15);
            //height
            ctx.fillText(this._originalHeight * 0.5, width * 0.5 + 5, 15);
            ctx.fillText('-' + this._originalHeight * 0.5, width * 0.5 + 5, height - 5);

            ctx.stroke();
            ctx.restore();
        },
        _clearAxes: function () {
            var ctx = this._canvas.contextTop;
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        },
        getCanvasDataURL: function () {
            var url = this._canvas.toDataURL(this._originalWidth, this._originalHeight);
            return url;
        },
        _onLanguageChangeHandler: function () {
            //make sure that variables using a i18nString get updated after updating internal cache
            window.setTimeout(this.render.bind(this), 200);
        },
        render: function () {
            this._redrawRequired = true;
        },
        _redrawCanvas: function () {
            if (!this._redrawRequired)
                return;

            this._redrawRequired = false;
            this._canvas.render();
        },
        dispose: function () {
            SmartJs.AnimationFrame.removeEventListener(new SmartJs.Event.EventListener(this._redrawCanvas, this));
            if (PocketCode.I18nProvider)
                PocketCode.I18nProvider.onLanguageChange.removeEventListener(new SmartJs.Event.EventListener(this._onLanguageChangeHandler, this));
            SmartJs.Ui.Window.onResize.removeEventListener(new SmartJs.Event.EventListener(this._windowOrientationChangeHandler, this));
            this.onResize.dispose();
            SmartJs.Ui.Control.prototype.dispose.call(this);
        },

    });

    return PlayerViewportView;
})();
