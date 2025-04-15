"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDummyTemplate = exports.createDataStore = void 0;
var index_1 = require("../src/index");
var node_perf_hooks_1 = require("node:perf_hooks");
var node_crypto_1 = require("node:crypto");
var keys_1 = require("@libp2p/crypto/keys");
var datastore_level_1 = require("datastore-level");
var utils_1 = require("../src/core/utils");
var createDataStore = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var datastore;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                datastore = new datastore_level_1.LevelDatastore(path);
                return [4 /*yield*/, datastore.open()];
            case 1:
                _a.sent();
                return [2 /*return*/, datastore];
        }
    });
}); };
exports.createDataStore = createDataStore;
var createDummyTemplate = function (providerPeerIdStr) {
    var templateHtml = "<html><body><h1>Test Template with test variable: {{test}} </h1></body></html>";
    var templateId = (0, utils_1.computeTemplateId)(providerPeerIdStr, templateHtml);
    var template = {
        templateId: templateId,
        data: templateHtml,
        createdAt: Math.floor(Date.now() / 1000),
    };
    return { template: template, templateId: templateId };
};
exports.createDummyTemplate = createDummyTemplate;
function runMultiWorkerTest(numWorkers, tasksPerWorker) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, manager, _a, managerPeerId, managerMultiAddr, _b, template, templateId, workers, totalTasks, taskPromises, _loop_1, i, completedTasks, completedCount;
        var _c;
        var _this = this;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("Starting test with ".concat(numWorkers, " workers and ").concat(tasksPerWorker, " tasks each..."));
                    startTime = node_perf_hooks_1.performance.now();
                    _a = index_1.createManager;
                    _c = {};
                    return [4 /*yield*/, (0, exports.createDataStore)("/tmp/manager-stress-test")];
                case 1:
                    _c.datastore = _e.sent();
                    return [4 /*yield*/, (0, keys_1.generateKeyPairFromSeed)("Ed25519", (0, node_crypto_1.randomBytes)(32))];
                case 2: return [4 /*yield*/, _a.apply(void 0, [(_c.privateKey = _e.sent(),
                            _c.autoManage = false,
                            _c)])];
                case 3:
                    manager = _e.sent();
                    return [4 /*yield*/, manager.start()];
                case 4:
                    _e.sent();
                    managerPeerId = manager.entity.getPeerId();
                    managerMultiAddr = (_d = manager.entity.getMultiAddress()) === null || _d === void 0 ? void 0 : _d[0];
                    if (!managerMultiAddr) {
                        throw new Error("Manager multiaddress is undefined");
                    }
                    _b = (0, exports.createDummyTemplate)(managerPeerId.toString()), template = _b.template, templateId = _b.templateId;
                    return [4 /*yield*/, manager.templateManager.registerTemplate({
                            template: template,
                            providerPeerIdStr: managerPeerId.toString(),
                        })];
                case 5:
                    _e.sent();
                    return [4 /*yield*/, Promise.all(Array(numWorkers)
                            .fill(0)
                            .map(function (_, i) { return __awaiter(_this, void 0, void 0, function () {
                            var worker, _a;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = index_1.createWorker;
                                        _b = {};
                                        return [4 /*yield*/, (0, exports.createDataStore)("/tmp/worker-stress-test-".concat(i))];
                                    case 1:
                                        _b.datastore = _c.sent();
                                        return [4 /*yield*/, (0, keys_1.generateKeyPairFromSeed)("Ed25519", (0, node_crypto_1.randomBytes)(32))];
                                    case 2: return [4 /*yield*/, _a.apply(void 0, [(_b.privateKey = _c.sent(),
                                                _b.getSessionData = function () { return ({
                                                    nonce: 0n,
                                                    recipient: "recipient-".concat(i),
                                                }); },
                                                _b)])];
                                    case 3:
                                        worker = _c.sent();
                                        return [4 /*yield*/, worker.start()];
                                    case 4:
                                        _c.sent();
                                        return [4 /*yield*/, worker.connect(managerMultiAddr)];
                                    case 5:
                                        _c.sent();
                                        return [2 /*return*/, worker];
                                }
                            });
                        }); }))];
                case 6:
                    workers = _e.sent();
                    totalTasks = numWorkers * tasksPerWorker;
                    taskPromises = [];
                    _loop_1 = function (i) {
                        var workerIdx, taskId, taskPromise;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    workerIdx = i % numWorkers;
                                    taskId = "task-".concat(i);
                                    taskPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                                        var task;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    task = {
                                                        id: taskId,
                                                        title: "Task ".concat(i),
                                                        reward: 100n,
                                                        timeLimitSeconds: 600,
                                                        templateId: templateId,
                                                        templateData: '{"test": "value"}',
                                                    };
                                                    return [4 /*yield*/, manager.taskManager.createTask({
                                                            task: task,
                                                            providerPeerIdStr: managerPeerId.toString(),
                                                        })];
                                                case 1:
                                                    _a.sent();
                                                    // Worker accepts and completes
                                                    return [4 /*yield*/, workers[workerIdx].acceptTask({ taskId: taskId })];
                                                case 2:
                                                    // Worker accepts and completes
                                                    _a.sent();
                                                    return [4 /*yield*/, workers[workerIdx].completeTask({
                                                            taskId: taskId,
                                                            result: "Result ".concat(i),
                                                        })];
                                                case 3:
                                                    _a.sent();
                                                    return [2 /*return*/, true];
                                            }
                                        });
                                    }); })();
                                    taskPromises.push(taskPromise);
                                    if (!(i % 100 === 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, Promise.all(taskPromises.splice(0, taskPromises.length))];
                                case 1:
                                    _f.sent();
                                    _f.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _e.label = 7;
                case 7:
                    if (!(i < totalTasks)) return [3 /*break*/, 10];
                    return [5 /*yield**/, _loop_1(i)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9:
                    i++;
                    return [3 /*break*/, 7];
                case 10: 
                // Wait for remaining tasks
                return [4 /*yield*/, Promise.all(taskPromises)];
                case 11:
                    // Wait for remaining tasks
                    _e.sent();
                    return [4 /*yield*/, manager.taskManager.listTasks()];
                case 12:
                    completedTasks = _e.sent();
                    completedCount = completedTasks.filter(function (t) {
                        return t.events.some(function (e) { return e.type === "payout"; });
                    }).length;
                    console.log("Completed ".concat(completedCount, "/").concat(totalTasks, " tasks"));
                    console.log("Test took ".concat((node_perf_hooks_1.performance.now() - startTime) / 1000, " seconds"));
                    // 6. Cleanup
                    return [4 /*yield*/, Promise.all(workers.map(function (w) { return w.stop(); }))];
                case 13:
                    // 6. Cleanup
                    _e.sent();
                    return [4 /*yield*/, manager.stop()];
                case 14:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run with 10 workers, 50 tasks each (500 total tasks)
runMultiWorkerTest(5, 50).catch(console.error);
