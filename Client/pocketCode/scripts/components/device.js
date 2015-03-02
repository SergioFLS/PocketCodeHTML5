/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../core.js" />
'use strict';

PocketCode.Device = (function () {

    function Device() {
        this.sensorEmulation = false;

        this.isMobile = SmartJs.Device.isMobile;
        this.isTouch = SmartJs.Device.isTouch;

        //events
        this._onKeypress = new SmartJs.Event.Event(this);
        this._onSupportChange = new SmartJs.Event.Event(this);  //this event is triggered if sensor is used that is not supported

        //init
        this._sensorSupport = {
            X_ACCELERATION: true,
            Y_ACCELERATION: true,
            Z_ACCELERATION: true, 
            COMPASS_DIRECTION: true,    //?
            X_INCLINATION: true, 
            Y_INCLINATION: true, 
            LOUDNESS: false,    //notify?
        };
        this._sensorEmulatedData = {
            X_ACCELERATION: 0,
            Y_ACCELERATION: 0,
            Z_ACCELERATION: 0,
            COMPASS_DIRECTION: 0,
            X_INCLINATION: 0,
            Y_INCLINATION: 0,
            LOUDNESS: 0,
        };

        this._initSensors();
    }

    //properties
    Object.defineProperties(Device.prototype, {
        accelerationX: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        accelerationY: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        accelerationZ: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        compassDirection: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        inclinationX: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        inclinationY: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
        loudness: {
            get: function () {
                return 0;   //TODO:
            },
            //enumerable: false,
            //configurable: true,
        },
    });

    //events
    Object.defineProperties(Device.prototype, {
        onKeypress: {
            get: function () { return this._onKeypress; },
            //enumerable: false,
            //configurable: true,
        },
        onSupportChange: {
            get: function () { return this._onSupportChange; },
            //enumerable: false,
            //configurable: true,
        },
    });

    //methods
    Device.prototype.merge({
        _initSensors: function () {
            //TODO: check sensor support
            //http://www.html5rocks.com/en/tutorials/device/orientation/
            //if (window.DeviceOrientationEvent) { }

            //if (window.DeviceMotionEvent) { }

            //compass: http://ai.github.io/compass.js/

            //set this.sensorEmulation to true if theres no native device support
            //
        },
        setSensorInUse: function (sensor) {
            if (this._sensorSupport[sensor]) {
                var supported= this._sensorSupport[sensor];
                if (!supported && !this.sensorEmulation) {
                    this.sensorEmulation = true;
                    this.onSupportChange.dispatchEvent();
                }
            }
            else    //unknown sensor
                throw new Error('device: unknown sensor: ' + sensor);
        },

    });

    return Device;
})();