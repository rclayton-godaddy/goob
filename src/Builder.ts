import GoobContext, {
  ChildOptions,
  CloseOptions,
  DecrementFn,
  GaugeFn,
  IncrementFn,
  LogFn,
  ObserveOptions,
  Outcomes,
  StartSpan,
  StartTrace,
  TimerFn
} from './GoobContext';
import { ElasticCommonSchema } from 'ecs-schema';

import LoggerService from './impl/pino/PinoLoggerService';

export interface LoggerService {
  trace: LogFn,
  debug: LogFn,
  info: LogFn,
  warn: LogFn,
  error: LogFn,
  fatal: LogFn,
  child(schema: ElasticCommonSchema): LoggerService,
  close(): void,
}

export interface MetricsService {
  start: TimerFn,
  decrement: DecrementFn;
  gauge: GaugeFn;
  increment: IncrementFn;
  child(schema: ElasticCommonSchema): MetricsService,
  close(): void,
}

export interface TracingService {
  startTrace(options: StartTrace): void,
  startSpan(options: StartSpan): void,
  closeTrace(outcome: Outcomes): void,
  closeSpan(outcome: Outcomes): void,
  child(schema: ElasticCommonSchema): TracingService,
  close(): void,
}

export type Dependencies = {
  logger: LoggerService,
  metrics: MetricsService,
  tracing: TracingService,
}

export type LoggerArgsNoSchema = [message: string, ...args: any[]];
export type LoggerArgsWithSchema = [context: ElasticCommonSchema, message: string, ...args: any[]];
export type LoggerArgs = LoggerArgsNoSchema | LoggerArgsWithSchema;

export class PluggableGoobContext implements GoobContext {

  protected logger: LoggerService;
  protected metrics: MetricsService;
  protected tracing: TracingService;

  public trace: LogFn;
  public debug: LogFn;
  public info: LogFn;
  public warn: LogFn;
  public error: LogFn;
  public fatal: LogFn;
  public gauge: GaugeFn;
  public increment: IncrementFn;
  public decrement: DecrementFn;
  public startTimer: TimerFn;

  constructor({ logger, metrics, tracing }: Dependencies) {
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

  async observe<T>(schema: ElasticCommonSchema, fn: (ctx: GoobContext) => Promise<T>, options: ObserveOptions = {}): Promise<T> {
    const stop = this.metrics.start(schema, options.name || options?.span?.name || 'timer')
    const subcontext = this.child(schema, options);
    try {
      const result = await fn(subcontext);
      stop();
      subcontext.close({ outcome: Outcomes.Success, closeTrace: !!options.tracing });
      return result;
    } catch (error) {
      stop();
      subcontext.close({ outcome: Outcomes.Failure, closeTrace: !!options.tracing });
      throw error;
    }
  }

  child(schema: ElasticCommonSchema, options: ChildOptions = {}): GoobContext {
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

  close(options?: CloseOptions): void {
    this.logger.close();
    this.metrics.close();
    this.tracing.close();
  }
}

export default class Builder {

  protected logger: LoggerService;
  protected metrics: MetricsService;
  protected tracing: TracingService;

  usingStdoutMetric(): this {
    return this;
  }

  usingStdoutTracing(): this {
    return this;
  }

  usingPinoLogger(): this {
    this.logger = new LoggerService()
    return this;
  }

  build(): GoobContext {
    return new PluggableGoobContext({
      logger: this.logger || new LoggerService(),
      metrics: this.metrics,
      tracing: this.tracing,
    });
  }
}
