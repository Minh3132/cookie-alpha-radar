var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var COOKIEBOX = 'https://agg.cookiebox.app';
var COOKIESCAN_SWAP = 'https://swap.cookiescan.io/api';
function readJson(url_1, init_1) {
    return __awaiter(this, arguments, void 0, function (url, init, timeoutMs) {
        var controller, id, r, text;
        if (timeoutMs === void 0) { timeoutMs = 12000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller = new AbortController();
                    id = setTimeout(function () { return controller.abort(); }, timeoutMs);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, init), { signal: controller.signal, headers: __assign({ 'content-type': 'application/json' }, ((init === null || init === void 0 ? void 0 : init.headers) || {})) }))];
                case 2:
                    r = _a.sent();
                    return [4 /*yield*/, r.text()];
                case 3:
                    text = _a.sent();
                    if (!r.ok)
                        throw new Error("".concat(r.status, ": ").concat(text.slice(0, 180)));
                    return [2 /*return*/, JSON.parse(text)];
                case 4:
                    clearTimeout(id);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function localApi() {
    return {
        name: 'cookie-alpha-local-api',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var url, inputMint, outputMint, amount, slippageBps, owner, qs, _a, cb, cs, quotes, errors, q, q, chunks, chunk, e_1_1, body, aggregator, inputMint, outputMint, amount, _b, slippageBps, owner, rawRoute, built, built, e_2;
                var _c, req_1, req_1_1;
                var _d, e_1, _e, _f;
                var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                return __generator(this, function (_s) {
                    switch (_s.label) {
                        case 0:
                            if (!((_g = req.url) === null || _g === void 0 ? void 0 : _g.startsWith('/api/')))
                                return [2 /*return*/, next()];
                            res.setHeader('content-type', 'application/json');
                            res.setHeader('cache-control', 'no-store');
                            _s.label = 1;
                        case 1:
                            _s.trys.push([1, 21, , 22]);
                            url = new URL(req.url, 'http://localhost');
                            if (!(url.pathname === '/api/quote' && req.method === 'GET')) return [3 /*break*/, 3];
                            inputMint = url.searchParams.get('inputMint') || '';
                            outputMint = url.searchParams.get('outputMint') || '';
                            amount = url.searchParams.get('amount') || '';
                            slippageBps = url.searchParams.get('slippageBps') || '500';
                            owner = url.searchParams.get('owner') || '';
                            if (!inputMint || !outputMint || !/^\d+$/.test(amount))
                                throw new Error('invalid quote fields');
                            qs = new URLSearchParams(__assign({ inputMint: inputMint, outputMint: outputMint, amount: amount, slippageBps: slippageBps }, (owner ? { owner: owner } : {})));
                            return [4 /*yield*/, Promise.allSettled([
                                    readJson("".concat(COOKIEBOX, "/quote?").concat(qs)),
                                    readJson("".concat(COOKIESCAN_SWAP, "/quote/multi-route?").concat(new URLSearchParams({ inputMint: inputMint, outputMint: outputMint, amount: amount, slippageBps: slippageBps }))),
                                ])];
                        case 2:
                            _a = _s.sent(), cb = _a[0], cs = _a[1];
                            quotes = [];
                            errors = [];
                            if (cb.status === 'fulfilled' && ((_h = cb.value) === null || _h === void 0 ? void 0 : _h.route)) {
                                q = cb.value.route;
                                quotes.push({ aggregator: 'cookiebox', inputMint: inputMint, outputMint: outputMint, inAmount: String((_j = q.inAmount) !== null && _j !== void 0 ? _j : amount), outAmount: String((_l = (_k = q.netOutAmount) !== null && _k !== void 0 ? _k : q.outAmount) !== null && _l !== void 0 ? _l : '0'), minOutAmount: q.minOutAmount == null ? null : String(q.minOutAmount), priceImpactPct: Number.isFinite(Number(q.priceImpactPct)) ? Number(q.priceImpactPct) : null, route: Array.isArray(q.path) ? q.path : [], raw: q });
                            }
                            else
                                errors.push("cookiebox: ".concat(cb.status === 'rejected' ? ((_m = cb.reason) === null || _m === void 0 ? void 0 : _m.message) || cb.reason : 'no route'));
                            if (cs.status === 'fulfilled' && ((_o = cs.value) === null || _o === void 0 ? void 0 : _o.multiRoute)) {
                                q = cs.value.multiRoute;
                                quotes.push({ aggregator: 'cookiescan', inputMint: inputMint, outputMint: outputMint, inAmount: String((_p = q.totalInAmount) !== null && _p !== void 0 ? _p : amount), outAmount: String((_q = q.totalOutAmount) !== null && _q !== void 0 ? _q : '0'), minOutAmount: q.minOutAmount == null ? null : String(q.minOutAmount), priceImpactPct: Number.isFinite(Number(q.combinedPriceImpactPct)) ? Number(q.combinedPriceImpactPct) : null, route: Array.isArray(q.route) ? q.route : [], raw: q });
                            }
                            else
                                errors.push("cookiescan: ".concat(cs.status === 'rejected' ? ((_r = cs.reason) === null || _r === void 0 ? void 0 : _r.message) || cs.reason : 'no route'));
                            quotes.sort(function (a, b) { return BigInt(b.outAmount) > BigInt(a.outAmount) ? 1 : BigInt(b.outAmount) < BigInt(a.outAmount) ? -1 : 0; });
                            res.statusCode = 200;
                            res.end(JSON.stringify({ quotes: quotes, errors: errors }));
                            return [2 /*return*/];
                        case 3:
                            if (!(url.pathname === '/api/swap-tx' && req.method === 'POST')) return [3 /*break*/, 20];
                            chunks = [];
                            _s.label = 4;
                        case 4:
                            _s.trys.push([4, 9, 10, 15]);
                            _c = true, req_1 = __asyncValues(req);
                            _s.label = 5;
                        case 5: return [4 /*yield*/, req_1.next()];
                        case 6:
                            if (!(req_1_1 = _s.sent(), _d = req_1_1.done, !_d)) return [3 /*break*/, 8];
                            _f = req_1_1.value;
                            _c = false;
                            chunk = _f;
                            chunks.push(Buffer.from(chunk));
                            _s.label = 7;
                        case 7:
                            _c = true;
                            return [3 /*break*/, 5];
                        case 8: return [3 /*break*/, 15];
                        case 9:
                            e_1_1 = _s.sent();
                            e_1 = { error: e_1_1 };
                            return [3 /*break*/, 15];
                        case 10:
                            _s.trys.push([10, , 13, 14]);
                            if (!(!_c && !_d && (_e = req_1.return))) return [3 /*break*/, 12];
                            return [4 /*yield*/, _e.call(req_1)];
                        case 11:
                            _s.sent();
                            _s.label = 12;
                        case 12: return [3 /*break*/, 14];
                        case 13:
                            if (e_1) throw e_1.error;
                            return [7 /*endfinally*/];
                        case 14: return [7 /*endfinally*/];
                        case 15:
                            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                            aggregator = body.aggregator, inputMint = body.inputMint, outputMint = body.outputMint, amount = body.amount, _b = body.slippageBps, slippageBps = _b === void 0 ? 500 : _b, owner = body.owner, rawRoute = body.rawRoute;
                            if (!owner || !inputMint || !outputMint || !amount)
                                throw new Error('missing swap fields');
                            if (!(aggregator === 'cookiebox')) return [3 /*break*/, 17];
                            return [4 /*yield*/, readJson("".concat(COOKIEBOX, "/swap-tx"), { method: 'POST', body: JSON.stringify({ inputMint: inputMint, outputMint: outputMint, amount: String(amount), slippageBps: Number(slippageBps), owner: owner }) }, 60000)];
                        case 16:
                            built = _s.sent();
                            res.statusCode = 200;
                            res.end(JSON.stringify({ aggregator: aggregator, transactionBase64: built.transactionBase64, blockhash: built.blockhash, lastValidBlockHeight: built.lastValidBlockHeight }));
                            return [2 /*return*/];
                        case 17:
                            if (!(aggregator === 'cookiescan')) return [3 /*break*/, 19];
                            if (!rawRoute)
                                throw new Error('missing Candy Shop route');
                            return [4 /*yield*/, readJson("".concat(COOKIESCAN_SWAP, "/swap-tx/multi-route"), { method: 'POST', body: JSON.stringify({ multiRoute: rawRoute, userPublicKey: owner }) }, 20000)];
                        case 18:
                            built = _s.sent();
                            res.statusCode = 200;
                            res.end(JSON.stringify({ aggregator: aggregator, transactionBase64: built.transactionBase64 }));
                            return [2 /*return*/];
                        case 19: throw new Error('unsupported aggregator');
                        case 20:
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'not found' }));
                            return [3 /*break*/, 22];
                        case 21:
                            e_2 = _s.sent();
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: e_2 instanceof Error ? e_2.message : 'local api failed' }));
                            return [3 /*break*/, 22];
                        case 22: return [2 /*return*/];
                    }
                });
            }); });
        }
    };
}
export default defineConfig({
    plugins: [react(), localApi()],
    server: { port: 4173 },
});
