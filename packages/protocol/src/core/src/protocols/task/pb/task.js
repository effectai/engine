"use strict";
/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
var protons_runtime_1 = require("protons-runtime");
var Task;
(function (Task) {
    var Task$dataEntry;
    (function (Task$dataEntry) {
        var _codec;
        Task$dataEntry.codec = function () {
            if (_codec == null) {
                _codec = (0, protons_runtime_1.message)(function (obj, w, opts) {
                    if (opts === void 0) { opts = {}; }
                    if (opts.lengthDelimited !== false) {
                        w.fork();
                    }
                    if ((obj.key != null && obj.key !== '')) {
                        w.uint32(10);
                        w.string(obj.key);
                    }
                    if ((obj.value != null && obj.value !== '')) {
                        w.uint32(18);
                        w.string(obj.value);
                    }
                    if (opts.lengthDelimited !== false) {
                        w.ldelim();
                    }
                }, function (reader, length, opts) {
                    if (opts === void 0) { opts = {}; }
                    var obj = {
                        key: '',
                        value: ''
                    };
                    var end = length == null ? reader.len : reader.pos + length;
                    while (reader.pos < end) {
                        var tag = reader.uint32();
                        switch (tag >>> 3) {
                            case 1: {
                                obj.key = reader.string();
                                break;
                            }
                            case 2: {
                                obj.value = reader.string();
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
        Task$dataEntry.encode = function (obj) {
            return (0, protons_runtime_1.encodeMessage)(obj, Task$dataEntry.codec());
        };
        Task$dataEntry.decode = function (buf, opts) {
            return (0, protons_runtime_1.decodeMessage)(buf, Task$dataEntry.codec(), opts);
        };
    })(Task$dataEntry = Task.Task$dataEntry || (Task.Task$dataEntry = {}));
    var _codec;
    Task.codec = function () {
        if (_codec == null) {
            _codec = (0, protons_runtime_1.message)(function (obj, w, opts) {
                if (opts === void 0) { opts = {}; }
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if ((obj.id != null && obj.id !== '')) {
                    w.uint32(2);
                    w.string(obj.id);
                }
                if ((obj.owner != null && obj.owner !== '')) {
                    w.uint32(10);
                    w.string(obj.owner);
                }
                if ((obj.manager != null && obj.manager !== '')) {
                    w.uint32(18);
                    w.string(obj.manager);
                }
                if ((obj.repetition != null && obj.repetition !== 0)) {
                    w.uint32(24);
                    w.int32(obj.repetition);
                }
                if ((obj.reward != null && obj.reward !== '')) {
                    w.uint32(34);
                    w.string(obj.reward);
                }
                if ((obj.template != null && obj.template !== '')) {
                    w.uint32(42);
                    w.string(obj.template);
                }
                if (obj.data != null && obj.data.size !== 0) {
                    for (var _i = 0, _a = obj.data.entries(); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], value = _b[1];
                        w.uint32(50);
                        Task.Task$dataEntry.codec().encode({ key: key, value: value }, w);
                    }
                }
                if ((obj.result != null && obj.result !== '')) {
                    w.uint32(58);
                    w.string(obj.result);
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, function (reader, length, opts) {
                var _a;
                if (opts === void 0) { opts = {}; }
                var obj = {
                    id: '',
                    owner: '',
                    manager: '',
                    repetition: 0,
                    reward: '',
                    template: '',
                    data: new Map(),
                    result: ''
                };
                var end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 0: {
                            obj.id = reader.string();
                            break;
                        }
                        case 1: {
                            obj.owner = reader.string();
                            break;
                        }
                        case 2: {
                            obj.manager = reader.string();
                            break;
                        }
                        case 3: {
                            obj.repetition = reader.int32();
                            break;
                        }
                        case 4: {
                            obj.reward = reader.string();
                            break;
                        }
                        case 5: {
                            obj.template = reader.string();
                            break;
                        }
                        case 6: {
                            if (((_a = opts.limits) === null || _a === void 0 ? void 0 : _a.data) != null && obj.data.size === opts.limits.data) {
                                throw new protons_runtime_1.MaxSizeError('Decode error - map field "data" had too many elements');
                            }
                            var entry = Task.Task$dataEntry.codec().decode(reader, reader.uint32());
                            obj.data.set(entry.key, entry.value);
                            break;
                        }
                        case 7: {
                            obj.result = reader.string();
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
    Task.encode = function (obj) {
        return (0, protons_runtime_1.encodeMessage)(obj, Task.codec());
    };
    Task.decode = function (buf, opts) {
        return (0, protons_runtime_1.decodeMessage)(buf, Task.codec(), opts);
    };
})(Task || (exports.Task = Task = {}));
