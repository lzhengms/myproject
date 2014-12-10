(function (_aoUndefined) {
    var _sAgent = navigator.userAgent.toLowerCase(), _bIsWin = /(windows|win32)/.test(_sAgent), _bIsMac = /(macintosh|mac os x)/.test(_sAgent), _sMacVer = /mac os x ((\d+|\.|_)+)/.test(_sAgent) && RegExp.$1.replace(/_/g, "."), _sFFVer = /firefox\/((\d|\.)+)/.test(_sAgent) && ("" + RegExp.$1), _sChromeVer = /chrome\/((\d|\.)+)/.test(_sAgent) && ("" + RegExp.$1), _sSafariVer = /version\/((\d|\.)+)/i.test(_sAgent) && ("" + RegExp.$1), _sQBVer = /qqbrowser\/((\d|\.)+)/i.test(_sAgent) && RegExp.$1, _bSupportActiveX = window.ActiveXObject != _aoUndefined;
    var _oNameMap = {screencapture: 0, uploader: 2, ftn: 3, dropfile: 4};

    function _getNameId(_avValue) {
        var _sType = typeof _avValue;
        return _sType == "number" ? _avValue : (_sType == "string" ? _oNameMap[_avValue] : _aoUndefined);
    }

    function _getWebkitContentType(_asValue1, _asValue2) {
        return navigator && navigator.mimeTypes && navigator.mimeTypes[_asValue1] ? _asValue1 : _asValue2;
    }

    var _sQQMailContentType = _getWebkitContentType("application/x-tencent-qmail-webkit", "application/x-tencent-qmail"), _sFtnContentType = _getWebkitContentType("application/txftn-webkit", "application/txftn");
    var _sWinIEQQMailLastVersion = "1.0.1.51", _sWinIEQQMailMiniVersion = "1.0.1.28", _sWinWebkitQQMailLastVersion = "1.0.1.51", _sWinWebkitQQMailMiniVersion = "1.0.1.28", _sMacWebkitQQMailLastVersion = "1.0.1.34", _sMacWebkitQQMailMiniVersion = "1.0.1.34";
    var _QMAXInfo = {_moInfos_IE: {progID: ["TXGYMailActiveX.ScreenCapture", "", "TXGYMailActiveX.Uploader", "TXFTNActiveX.FTNUpload", "TXGYMailActiveX.DropFile"], lastVer: [_sWinIEQQMailLastVersion, "", _sWinIEQQMailLastVersion, "1.0.0.18", _sWinIEQQMailLastVersion], miniVer: [_sWinIEQQMailMiniVersion, "", _sWinIEQQMailMiniVersion, "1.0.0.11", _sWinIEQQMailMiniVersion]}, _moInfos_WebKit: {name: ["QQMail Plugin", "", "QQMail Plugin", "Tencent FTN plug-in", ""], type: [_sQQMailContentType, "", _sQQMailContentType, _sFtnContentType, ""], lastVer: [_sWinWebkitQQMailLastVersion, "", _sWinWebkitQQMailLastVersion, "1.0.0.3", ""], miniVer: [_sWinWebkitQQMailMiniVersion, "", _sWinWebkitQQMailMiniVersion, "1.0.0.1", ""]}, _moInfos_WebKitForMac: {name: ["QQMailPlugin", "", "QQMailPlugin", "Tencent FTN Plug-in", ""], type: [_sQQMailContentType, "", _sQQMailContentType, _sFtnContentType, ""], lastVer: [_sMacWebkitQQMailLastVersion, "", _sMacWebkitQQMailLastVersion, "1.0.0.3", ""], miniVer: [_sMacWebkitQQMailMiniVersion, "", _sMacWebkitQQMailMiniVersion, "1.0.0.3", ""]}, get: function (_asInfoType, _asBrowserType) {
        return (_bIsMac ? this._moInfos_WebKitForMac : (_bSupportActiveX ? this._moInfos_IE : this._moInfos_WebKit))[_asInfoType];
    }};

    function _compareVersion(_asVersion1, _asVersion2) {
        var _oVer1 = _asVersion1.split("."), _nVer1Len = _oVer1.length, _oVer2 = _asVersion2.split("."), _nVer2Len = _oVer2.length;
        for (var i = 0; i < _nVer1Len && i < _nVer2Len; i++) {
            var _nV1 = parseInt(_oVer1[i]), _nV2 = parseInt(_oVer2[i]);
            if (_nV1 == _nV2) {
                continue;
            }
            return _nV1 > _nV2 ? 1 : -1;
        }
        if (i < _nVer1Len) {
            return 1;
        }
        if (i < _nVer2Len) {
            return -1;
        }
        return 0;
    }

    function _checkPlugin(_anPluginId) {
        if (!(_bIsWin || (_bIsMac && _compareVersion(_sMacVer, "10.6.8") >= 0))) {
            return -5;
        }
        if (_bIsWin) {
            if ((_sFFVer && _compareVersion(_sFFVer, "3.0.8") < 0 && (!navigator.buildID || parseInt(navigator.buildID.substr(0, 8)) < 20090701)) || (_sQBVer && _compareVersion(_sQBVer, "6.5") < 0)) {
                return -3;
            }
        }
        else if (_bIsMac) {
            if ((_sFFVer && _compareVersion(_sFFVer, "3.6") < -1) || (_sChromeVer && _compareVersion(_sChromeVer, "8") < -1) || (_sSafariVer && _compareVersion(_sSafariVer, "5") < -1)) {
                return -3;
            }
        }
        var _sName = _QMAXInfo.get("name")[_anPluginId], _sType = _QMAXInfo.get("type")[_anPluginId], _oPlugins = navigator.plugins, _hasInstall = false;
        if (_oPlugins) {
            try {
                _oPlugins.refresh(false);
            }
            catch (e) {
            }
            if (!_sName) {
                return -6;
            }
            {
                var _oMimeInfo = navigator.mimeTypes[_sType];
                if (_oMimeInfo) {
                    do {
                        if (_anPluginId != 3 && (_sAgent.indexOf("vista") > -1 || /nt 6/gi.test(_sAgent)) && _sType == "application/x-tencent-qmail" && _oMimeInfo.enabledPlugin && !_oMimeInfo.enabledPlugin.description.split('#')[1]) {
                            break;
                        }
                        if (_bIsMac && _anPluginId != 3 && (/(\d+(?:\.\d+)+)/.test(_oMimeInfo.enabledPlugin && _oMimeInfo.enabledPlugin.description || "") ? RegExp.$1 : "1.0.0.0") == "1.0.0.0") {
                            break;
                        }
                        _hasInstall = true;
                        break;
                    }
                    while (1);
                }
            }
        }
        else {
            return -3;
        }
        return _hasInstall ? 0 : -2;
    }

    function _createWebkitPlugin(_anPluginId, _aoWin, _asAddonInstanceId) {
        var _oAddonIns, _oInstance = null, _sMineType = _QMAXInfo.get("type")[_anPluginId], _aoWin = _aoWin || window;
        if (_checkPlugin(_anPluginId) == 0) {
            var _sInsid = _asAddonInstanceId || ("QQMailPluginIns" + _sMineType);
            if (!(_oAddonIns = _aoWin.document.getElementById(_sInsid))) {
                _oAddonIns = _aoWin.document.createElement("embed");
                _oAddonIns.id = _sInsid;
                _oAddonIns.type = _sMineType;
                _oAddonIns.style.cssText = "width:1px;height:1px;position:absolute;top:0;left:0";
                _aoWin.document.body.insertBefore(_oAddonIns, _aoWin.document.body.firstChild);
            }
            try {
                switch (_anPluginId) {
                    case 0:
                        _oInstance = _oAddonIns.CreateScreenCapture();
                        break;
                    case 2:
                        _oInstance = _oAddonIns.CreateUploader();
                        break;
                    case 3:
                        _oInstance = _oAddonIns;
                        break;
                }
            }
            catch (e) {
            }
        }
        return _oInstance;
    }

    function _createActiveX(_anActivexId, _aoWin) {
        _aoWin = _aoWin || window;
        var _oInstance = null;
        try {
            _oInstance = new _aoWin.ActiveXObject(_QMAXInfo._moInfos_IE.progID[_anActivexId]);
            if (_anActivexId == 4) {
                var _oScreenCapture = new _aoWin.ActiveXObject(_QMAXInfo._moInfos_IE.progID[0]), _sFileName = "";
                try {
                    _sFileName = _oScreenCapture.GetDLLFileName();
                }
                catch (e) {
                }
                var _oDiv = document.createElement("div");
                _oDiv.innerHTML = ['<object classid="CLSID:', _sFileName.indexOf("_2.dll") != -1 ? "B0F77C07-8507-4AB9-B130-CC882FDDC046" : "F4BA5508-8AB7-45C1-8D0A-A1237AD82399", '"></object>'].join('');
                _oInstance = _oDiv.firstChild;
            }
        }
        catch (_oError) {
        }
        return _oInstance;
    }

    function _getVersion(_avInstance) {
        var _anActivexId = _getNameId(_avInstance), _oActiveXIns = /(number|string)/.test(typeof (_avInstance)) ? (_bSupportActiveX ? _createActiveX : _createWebkitPlugin)(_anActivexId) : _avInstance, _sVersion = "";
        try {
            _sVersion = _oActiveXIns.Version || "";
        }
        catch (_oError) {
        }
        return _sVersion;
    }

    function _create(_avActivexId, _aoWin, _asAddonInstanceId) {
        _aoWin = _aoWin || window;
        var _anActivexId = _getNameId(_avActivexId), _oInstance = (_bSupportActiveX ? _createActiveX : _createWebkitPlugin)(_anActivexId, _aoWin, _asAddonInstanceId);
        return _oInstance;
    }

    function _hackSafari(_aoWin) {
        if (_sSafariVer && _aoWin != window) {
            var _oInstance = _createWebkitPlugin(_anPluginId, _aoWin, _asAddonInstanceId);
            try {
                switch (_anPluginId) {
                    case 0:
                        _oInstance.OnCaptureFinished = function () {
                        };
                        break;
                    case 2:
                    case 3:
                        _oInstance.OnEvent = function () {
                        };
                        break;
                }
            }
            catch (e) {
            }
        }
    }

    function _isSupport(_avInstance) {
        var _nPluginId = _getNameId(_avInstance), _sLastVer = _QMAXInfo.get("lastVer")[_nPluginId], _sMiniVer = _QMAXInfo.get("miniVer")[_nPluginId];
        if (_nPluginId !== _aoUndefined && _sLastVer) {
            if (!_bSupportActiveX) {
                var _nError = _checkPlugin(_nPluginId);
                if (_nError < 0) {
                    return _nError;
                }
            }
            var _oInstance = (_bSupportActiveX ? _createActiveX : _createWebkitPlugin)(_nPluginId), _sVersion = _getVersion(_oInstance);
            if (!_oInstance || (_nPluginId != 4 && !_sVersion)) {
                return -2;
            }
            if (_nPluginId == 4) {
                return 2;
            }
            if (_compareVersion(_sVersion, _sLastVer) >= 0) {
                return 2;
            }
            if (_compareVersion(_sVersion, _sMiniVer) >= 0) {
                return 1;
            }
            return -1;
        }
        return -6;
    }

    window.QMActivex = {create: _create, isSupport: _isSupport, hackSafari: _hackSafari, getVersion: _getVersion, installUrl: location.protocol + "//mail.qq.com/cgi-bin/readtemplate?check=false&t=browser_addon", _getQMActivexPrivate: function (_asValue) {
        return eval(_asValue);
    }};
})();


//3736   6633