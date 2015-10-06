﻿/// <reference path="../smartJs/sj.js" />
/// <reference path="../smartJs/sj-core.js" />
/// <reference path="../smartJs/sj-event.js" />
/// <reference path="../smartJs/sj-communication.js" />
/// <reference path="../smartJs/sj-ui.js" />
/// <reference path="../smartJs/sj-components.js" />
/// <reference path="../core.js" />
'use strict';


PocketCode.merge({

    _InitialPopStateController: (function () {
        function _InitialPopStateController() {
            this.historyLength = history.length;    //browser history length at init 
            this.objClassName = '_InitialPopStateController';
        }

        return _InitialPopStateController;
    })(),

    HistoryEntry: (function () {
        function HistoryEntry(historyIdx, globalDialogsLength, page, pageViewState, pageDialogsLength) {
            this.historyIdx = historyIdx;
            this.globalDialogsLength = globalDialogsLength;
            this.page = {};
            if (typeof page === 'string')
                this.page.id = page;
            else if (typeof page === 'object' && page.objClassName)
                this.page.id = page.objClassName;
            else
                throw new Error('invalid arguemnt page: expected classname as string or an object supporting an accessor \'objClassName\'');
            this.page.viewState = pageViewState;
            this.page.dialogsLength = pageDialogsLength || 0;
        }

        return HistoryEntry;
    })(),

    PlayerApplication: (function () {
        PlayerApplication.extends(SmartJs.Components.Application, false);

        function PlayerApplication(viewportContainer, rfc3066, mobileInitialized) {
            var vp = new PocketCode.Ui.Viewport();
            vp.hide();
            this._dialogs = [];

            SmartJs.Components.Application.call(this, vp);
            this._mobileInitialized = mobileInitialized;
            this._noPromtOnLeave = false;   //TODO: settings (do not show promt on leave again?)
            this._forwardNavigationAllowed = false;

            if (!vp.rendered)
                vp.addToDom(viewportContainer || document.body);
            this._vp = vp;

            //events
            this._onInit = new SmartJs.Event.Event(this);               //triggered when the loading screen is available
            this._onMobileInitRequired = new SmartJs.Event.Event(this); //triggered on mobile devices to run the app in the scope of an user event
            //this._onError = new SmartJs.Event.Event(this);		    //defined in base class
            this._onHWRatioChange = new SmartJs.Event.Event(this);      //triggered to notify weboverlay on device resolution change
            this._onExit = new SmartJs.Event.Event(this);               //triggered to notify weboverlay to be closed & disposed

            this._onError.addEventListener(new SmartJs.Event.EventListener(this._globalErrorHandler, this));

            //init
            if (SmartJs.Device.isMobile && !mobileInitialized) {    //do not initialize the UI if app needs to be recreated for mobile 
                var state = history.state;
                if (state !== null && state.historyIdx > 0) //refresh pressed
                    history.go(-state.historyIdx);  //not to init page but to start page
                return;
            }

            this._pages = {
                _InitialPopStateController: new PocketCode._InitialPopStateController(),
                PlayerPageController: new PocketCode.PlayerPageController(),
            };

            this._project = new PocketCode.GameEngine();
            this._project.onLoadingError.addEventListener(new SmartJs.Event.EventListener(this._projectLoadingErrorHandler, this));
            this._currentProjectId = undefined;

            if (rfc3066)  //TODO:
                this._rfc3066 = rfc3066;
            //else
            //    this._initI18nProvider;

            //webOverlay is undefined if running in mobile page, no viewport defined
            this._isMobilePage = viewportContainer ? false : true;	//this represents the players mode, not the device

            //navigation controller
            if (SmartJs.Device.isMobile) {
                var historyIdx;
                if (history.state !== null)
                    historyIdx  = history.state.historyIdx;
                if (historyIdx === undefined || historyIdx === 0) {
                    this._currentHistoryIdx = 0; //stores our current history position, > navigationIdx means the latest navigation was back(), < mease forward(), 

                    history.replaceState(new PocketCode.HistoryEntry(this._currentHistoryIdx, this._dialogs.length, this._pages._InitialPopStateController), document.title, '');    //initial push to save entry point and trigger 'playerClose' event
                    this._pages._InitialPopStateController.historyLength = history.length;    //make sure we got the right length as some browsers start with = 0
                }
                this._popstateListener = this._addDomListener(window, 'popstate', this._popstateHandler);
            }
            else {  //desktop
                this._escKeyListener = this._addDomListener(document, 'keyup', function (e) { if (e.keyCode == 27) this._escKeyHandler(e); });
            }
        }

        //events: the application doesn't need any public properties or events: anyway.. this events are required to communicate with the web overlay
        Object.defineProperties(PlayerApplication.prototype, {
            onInit: {
                get: function () {
                    return this._onInit;
                }
            },
            onMobileInitRequired: {
                get: function () {
                    return this._onMobileInitRequired;
                }
            },
            onHWRatioChange: {
                get: function () {
                    return this._onHWRatioChange;
                }
            },
            onExit: {
                get: function () {
                    return this._onExit;
                }
            }
        });

        //methods
        PlayerApplication.prototype.merge({
            _globalErrorHandler: function (e) {
                var error = e.error,
                    msg = error.message,
                    file = error.file || error.filename || error.fileName,
                    line = error.lineno,
                    column = error.colno,
                    stack = '';
                if (error.error.stack)
                    stack = error.error.stack;

                var d = new PocketCode.Ui.GlobalErrorDialog();
                d.bodyInnerHTML += '<br /><br />Details: ';
                d.bodyInnerHTML += '{msg: ' + msg + ', file: ' + file.replace(new RegExp('/', 'g'), '/&shy;') + ', ln: ' + line + ', col: ' + column /*+ ', stack: ' + stack*/ + '}';
                d.bodyInnerHTML += '<br /><br />Application will be closed.';
                d.onOK.addEventListener(new SmartJs.Event.EventListener(function () { this._onExit.dispatchEvent(); }, this));
                this._onInit.dispatchEvent();   //hide splash screen
                this._showDialog(d, false);
                //stop gameEngine + loading
                this._project.dispose();
            },
            _projectLoadingErrorHandler: function (e) {
                alert("loading failed: unsupported sound format");
                //TODO: this._onExit.dispatchEvent();
                //TODO: cross origin should be checkt during startup- listed in Jira already

            },
            _requestProjectDetails: function (projectId) {
                var req = new PocketCode.ServiceRequest(PocketCode.Services.PROJECT_DETAILS, SmartJs.RequestMethod.GET, { id: projectId, imgDataMax: 0 });
                req.onLoad.addEventListener(new SmartJs.Event.EventListener(this._projectDetailsRequestLoadHandler, this));
                req.onError.addEventListener(new SmartJs.Event.EventListener(this._projectDetailsRequestErrorHandler, this));
                PocketCode.Proxy.send(req);
            },
            _projectDetailsRequestLoadHandler: function (e) {
                if (this._disposing || this._disposed)
                    return;
                var json = e.target.responseJson;
                this._onInit.dispatchEvent();
                this._pages.PlayerPageController.projectDetails = json;
                this._viewport.show();
                this._requestProject(this._currentProjectId);
            },
            _projectDetailsRequestErrorHandler: function (e) {
                if (this._disposing || this._disposed)
                    return;
                this._onInit.dispatchEvent();

                var d = new PocketCode.Ui.ProjectNotFoundDialog();
                d.onOK.addEventListener(new SmartJs.Event.EventListener(function () { this._onExit.dispatchEvent(); }, this));
                this._onInit.dispatchEvent();   //hide splash screen
                this._showDialog(d, false);

                //console.log('ERROR project details: ' + e);
            },
            _requestProject: function (projectId) {
                var req = new PocketCode.ServiceRequest(PocketCode.Services.PROJECT, SmartJs.RequestMethod.GET, { id: projectId });
                req.onLoad.addEventListener(new SmartJs.Event.EventListener(this._projectRequestLoadHandler, this));
                req.onError.addEventListener(new SmartJs.Event.EventListener(this._projectRequestErrorHandler, this));
                PocketCode.Proxy.send(req);
            },
            _projectRequestLoadHandler: function (e) {
                if (this._disposing || this._disposed)
                    return;
                var json = e.target.responseJson;
                if (json.header && json.header.device) {
                    var device = json.header.device;
                    this._onHWRatioChange.dispatchEvent({ ratio: device.screenHeight / device.screenWidth });
                }
                this._project.loadProject(json);
            },
            _projectRequestErrorHandler: function (e) {
                if (this._disposing || this._disposed)
                    return;

                //TODO: check errors to show the right dialog
                var d = new PocketCode.Ui.Pro.ProjectNotValidDialog();  //ParserErrorDialog, InternalServerErrorDialog, ServerConnectionErrorDialog
                d.bodyInnerHTML += '<br /> TODO: could be another ERROR too<br />';
                d.onOK.addEventListener(new SmartJs.Event.EventListener(function () { this._onExit.dispatchEvent(); }, this));
                this._onInit.dispatchEvent();   //hide splash screen
                this._showDialog(d, false);
                //TODO: parse error and show dialog
            },
            //navigation
            _escKeyHandler: function (e) {
                var l = this._dialogs.length;
                if (l > 0)
                    this._dialogs[l - 1].execDefaultBtnAction();
                else
                    this._currentPage.execDialogDefaultOnEsc();
            },
            _popstateHandler: function (e) {
                var hState = e.state;
                if (hState == null)	//chrome initial call
                    return e.preventDefault();
                if (!hState.page)
                    throw new Error('invalid navigation entry');

                var page = this._pages[hState.page.id];

                if (this._currentHistoryIdx < hState.historyIdx && !this._forwardNavigationAllowed) {    //prevent forward navigation
                    history.back();
                    return e.preventDefault();	//just to make sure this will not have any effects
                }

                this._currentHistoryIdx = hState.historyIdx;
                if (page.objClassName === '_InitialPopStateController') {
                    //        //TODO:
                    if (page.historyLength > 1) {    //there was a history when entering the app: stored in _InitialPopStateController
                        if (this._noPromtOnLeave || !this._project.projectLoaded)
                            this._onExit.dispatchEvent();
                        else {
                            var d = new PocketCode.Ui.ExitWarningDialog();
                            d.onExit.addEventListener(new SmartJs.Event.EventListener(function () { this._onExit.dispatchEvent(); }, this));
                            d.onCancel.addEventListener(new SmartJs.Event.EventListener(function (e) {
                                e.target.dispose();
                                this._forwardNavigationAllowed = true;
                                history.forward();
                            }, this));
                            this._onInit.dispatchEvent();   //hide splash screen
                            this._showDialog(d, false);
                        }
                    }
                    else {
                        this._forwardNavigationAllowed = true;
                        history.forward();
                    }
                    return e.preventDefault();
                }

                //else: navigate to page
                this._forwardNavigationAllowed = false;
                //handle global dialogs
                var dialogs = this._dialogs;
                for (var i = hState.dialogsLength || 0, l = dialogs.length - 1; i <= l; l--) {
                    dialogs[l].dispose();
                    dialogs.pop();
                }
                this._showPage(page, hState);  //load page or viewstate
            },
            _showPage: function (page, historyState) {
                if (!(page instanceof PocketCode.PageController))
                    throw new Error('invalid argument: page, expectet type: PocketCode.PageController');

                if (SmartJs.Device.isMobile) {
                    if (historyState) { //navigated by browser back
                        var pageState = historyState.page;
                        page.loadViewState(pageState.viewState, pageState.dialogsLength);

                    }
                    else {
                        this._currentHistoryIdx++;
                        history.pushState(new PocketCode.HistoryEntry(this._currentHistoryIdx, this._dialogs.length, page), document.title, '');

                    }
                    page.currentHistoryIdx = this._currentHistoryIdx;   //make sure the pageCotroller knows the current historyIdx for internal navigation
                }

                this._currentPage = page;
                this._vp.loadPageView(page.view);   //even if its currently shown its deconnected from DOM and reconnected visible + an resize event is dispatched internaly
            },
            _showDialog: function (dialog, createHistoryEntry) {
                if (!(dialog instanceof PocketCode.Ui.Dialog))
                    throw new Error('invalid argument: dialog');

                this._dialogs.push(dialog);

                if (SmartJs.Device.isMobile && createHistoryEntry !== false)    //create history entry
                    history.pushState(new PocketCode.HistoryEntry(this._currentHistoryIdx, this._dialogs.length, this._currentPage), document.title, '');   //TODO: add page viewState and Dialogs?

                this._viewport.addDialog(dialog);
                this._viewport.show();
            },
            loadProject: function (projectId) {
                if (this._disposing || this._disposed)// || this._projectLoaded)    //prevent loading more than once
                    return;

                //check browser compatibility
                var pc = PocketCode.isPlayerCompatible();
                var compatible = pc.result;

                if (!compatible) {	//framework not loaded correctly or compatibility failed
                    if (!pc.tests.SmartJs) {
                        alert('sorry.. your browser does not meet the HTML5 feature requirements to run this application');
                        this._onExit.dispatchEvent();
                    }
                    else {
                        var d = new PocketCode.Ui.BrowserNotSupportedDialog();
                        d.onOK.addEventListener(new SmartJs.Event.EventListener(function () { this._onExit.dispatchEvent(); }, this));
                        this._onInit.dispatchEvent();   //hide splash screen
                        this._showDialog(d, false);
                    }
                    return;
                }

                if (SmartJs.Device.isMobile && !this._mobileInitialized) {
                    //this._showMobileRestrictionDialog();    //reinit app in the scope of an user event
                    var d = new PocketCode.Ui.MobileRestrictionDialog();
                    d.onCancel.addEventListener(new SmartJs.Event.EventListener(function (e) { this._onExit.dispatchEvent(e); }, this));
                    d.onConfirm.addEventListener(new SmartJs.Event.EventListener(function (e) {
                        this._viewport.hide();
                        this._onMobileInitRequired.dispatchEvent(e);
                    }, this));
                    this._onInit.dispatchEvent();   //hide splash screen
                    this._showDialog(d, false);
                    return;
                }

                //show
                this._showPage(this._pages.PlayerPageController);
                //set project in page controller
                this._currentPage.project = this._project;

                this._currentProjectId = projectId;
                this._requestProjectDetails(projectId);
            },
            toggleMuteSounds: function () {
                this._muted = this._muted ? false : true;
                this._project.muted = this._muted;
                return this._muted;
            },
            dispose: function () {
                this._vp.hide();
                if (this._popstateListener)
                    this._removeDomListener(window, 'popstate', this._popstateListener);
                if (this._escKeyListener)
                    this._removeDomListener(document, 'keyup', this._escKeyListener);
                if (this._project)
                    this._project.onLoadingError.removeEventListener(new SmartJs.Event.EventListener(this._projectLoadingErrorHandler, this));
                //this._project.dispose();    //make sure the project gets disposed befor disposing the UI  -> ? -> this way the ui cannot unbind
                for (var page in this._pages)   //objects (dictionaries) are not handled by the core dispose functionality- make sure we do not miss them
                    this._pages[page].dispose();

                SmartJs.Components.Application.prototype.dispose.call(this);    //call super()
            },
        });

        return PlayerApplication;
    })(),
});
