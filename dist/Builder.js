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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluggableGoobContext = void 0;
const GoobContext_1 = require("./GoobContext");
const PinoLoggerService_1 = __importDefault(require("./impl/pino/PinoLoggerService"));
class PluggableGoobContext {
    constructor({ logger, metrics, tracing }) {
        this.logger = logger;
        this.metrics = metrics;
        this.tracing = tracing;
        this.trace = logger.trace.bind(logger);
        this.debug = logger.debug.bind(logger);
        this.info = logger.info.bind(logger);
        this.warn = logger.warn.bind(logger);
        this.error = logger.error.bind(logger);
        this.fatal = logger.fatal.bind(logger);
        this.gauge = metrics.gauge.bind(metrics);
        this.increment = metrics.increment.bind(metrics);
        this.decrement = metrics.decrement.bind(metrics);
        this.startTimer = metrics.start.bind(metrics);
    }
    observe(schema, fn, options = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const stop = this.metrics.start(schema, options.name || ((_a = options === null || options === void 0 ? void 0 : options.span) === null || _a === void 0 ? void 0 : _a.name) || 'timer');
            const subcontext = this.child(schema, options);
            try {
                const result = yield fn(subcontext);
                stop();
                subcontext.close({ outcome: GoobContext_1.Outcomes.Success, closeTrace: !!options.tracing });
                return result;
            }
            catch (error) {
                stop();
                subcontext.close({ outcome: GoobContext_1.Outcomes.Failure, closeTrace: !!options.tracing });
                throw error;
            }
        });
    }
    child(schema, options = {}) {
        if (options.tracing) {
            this.tracing.startTrace(options.tracing);
        }
        if (options.span) {
            this.tracing.startSpan(options.span);
        }
        return new PluggableGoobContext({
            logger: this.logger.child(schema),
            metrics: this.metrics.child(schema),
            tracing: this.tracing.child(schema),
        });
    }
    close(options) {
        this.logger.close();
        this.metrics.close();
        this.tracing.close();
    }
}
exports.PluggableGoobContext = PluggableGoobContext;
class Builder {
    usingStdoutMetric() {
        return this;
    }
    usingStdoutTracing() {
        return this;
    }
    usingPinoLogger() {
        this.logger = new PinoLoggerService_1.default();
        return this;
    }
    build() {
        return new PluggableGoobContext({
            logger: this.logger || new PinoLoggerService_1.default(),
            metrics: this.metrics,
            tracing: this.tracing,
        });
    }
}
exports.default = Builder;
//# sourceMappingURL=Builder.js.map