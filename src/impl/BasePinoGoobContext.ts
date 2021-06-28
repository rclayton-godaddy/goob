import { ElasticCommonSchema } from 'ecs-schema';
import { Logger } from 'pino';

import GoobContext, { ChildOptions, DecrementFn, GaugeFn, IncrementFn, ObserveFn, TimerFn } from '../GoobContext';

export default abstract class BasePinoGoobContext implements GoobContext {

  constructor(protected logger: Logger) {}

  trace(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.trace(schema, message, ...args);
  }

  debug(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.debug(schema, message, ...args);
  }

  info(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.info(schema, message, ...args);
  }

  warn(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.warn(schema, message, ...args);
  }

  error(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.error(schema, message, ...args);
  }

  fatal(schema: ElasticCommonSchema, message?: string, ...args: any[]) {
    this.logger.fatal(schema, message, ...args);
  }

  close(): void {}

  abstract decrement: DecrementFn;
  abstract gauge: GaugeFn;
  abstract increment: IncrementFn;
  abstract observe: ObserveFn;
  abstract startTimer: TimerFn;

  abstract child(schema: ElasticCommonSchema, options?: ChildOptions): GoobContext;
}
