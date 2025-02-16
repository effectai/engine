"use strict";
/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Peer = exports.Type = void 0;
var protons_runtime_1 = require("protons-runtime");
var alloc_1 = require("uint8arrays/alloc");
var Type;
(function (Type) {
    Type["WORKER"] = "WORKER";
    Type["MANAGER"] = "MANAGER";
})(Type || (exports.Type = Type = {}));
var __TypeValues;
(function (__TypeValues) {
    __TypeValues[__TypeValues["WORKER"] = 0] = "WORKER";
    __TypeValues[__TypeValues["MANAGER"] = 1] = "MANAGER";
})(__TypeValues || (__TypeValues = {}));
(function (Type) {
    Type.codec = function () {
        return (0, protons_runtime_1.enumeration)(__TypeValues);
    };
})(Type || (exports.Type = Type = {}));
var Peer;
(function (Peer) {
    var _codec;
    Peer.codec = function () {
        if (_codec == null) {
            _codec = (0, protons_runtime_1.message)(function (obj, w, opts) {
                if (opts === void 0) { opts = {}; }
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if ((obj.publicKey != null && obj.publicKey.byteLength > 0)) {
                    w.uint32(10);
                    w.bytes(obj.publicKey);
                }
                if (obj.type != null && __TypeValues[obj.type] !== 0) {
                    w.uint32(16);
                    Type.codec().encode(obj.type, w);
                }
                if (obj.addrs != null) {
                    for (var _i = 0, _a = obj.addrs; _i < _a.length; _i++) {
                        var value = _a[_i];
                        w.uint32(26);
                        w.bytes(value);
                    }
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, function (reader, length, opts) {
                var _a;
                if (opts === void 0) { opts = {}; }
                var obj = {
                    publicKey: (0, alloc_1.alloc)(0),
                    type: Type.WORKER,
                    addrs: []
                };
                var end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1: {
                            obj.publicKey = reader.bytes();
                            break;
                        }
                        case 2: {
                            obj.type = Type.codec().decode(reader);
                            break;
                        }
                        case 3: {
                            if (((_a = opts.limits) === null || _a === void 0 ? void 0 : _a.addrs) != null && obj.addrs.length === opts.limits.addrs) {
                                throw new protons_runtime_1.MaxLengthError('Decode error - map field "addrs" had too many elements');
                            }
                            obj.addrs.push(reader.bytes());
                            break;
                        }
                        default: {
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    Peer.encode = function (obj) {
        return (0, protons_runtime_1.encodeMessage)(obj, Peer.codec());
    };
    Peer.decode = function (buf, opts) {
        return (0, protons_runtime_1.decodeMessage)(buf, Peer.codec(), opts);
    };
})(Peer || (exports.Peer = Peer = {}));
