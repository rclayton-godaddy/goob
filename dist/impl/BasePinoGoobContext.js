"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BasePinoGoobContext {
    constructor(logger) {
        this.logger = logger;
    }
    trace(schema, message, ...args) {
        this.logger.trace(schema, message, ...args);
    }
    debug(schema, message, ...args) {
        this.logger.debug(schema, message, ...args);
    }
    info(schema, message, ...args) {
        this.logger.info(schema, message, ...args);
    }
    warn(schema, message, ...args) {
        this.logger.warn(schema, message, ...args);
    }
    error(schema, message, ...args) {
        this.logger.error(schema, message, ...args);
    }
    fatal(schema, message, ...args) {
        this.logger.fatal(schema, message, ...args);
    }
    close() { }
}
exports.default = BasePinoGoobContext;
//# sourceMappingURL=BasePinoGoobContext.js.map