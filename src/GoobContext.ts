import { ElasticCommonSchema, Float } from 'ecs-schema';

export type Percentage = Float;
export type Traceparent = string;
export type UnixTimestamp = number;

/**
 * Options to customize metrics.
 */
export type MetricsOptions = {
  /**
   * Percentage of samples that should be kept (forwarded to metrics backend).
   */
  sampleRate?: Percentage,
  /**
   * Unit of measurement
   */
  units?: string,
}

/**
 * Mirrors the functionality of Pino, except the mergingObject is specifically the ElasticCommonSchema.
 */
export interface LogFn {
  (schema: ElasticCommonSchema, message?: string, ...args: any[]): void
}

/**
 * Like a gauge on your dashboard, this is an instantaneous measurement of
 */
export interface GaugeFn {
  (schema: ElasticCommonSchema, gaugeName: string, measurement: number, options?: MetricsOptions): void
}

/**
 * Options for incrementing or decrementing.
 */
export type IncDecrOptions = MetricsOptions & {
  /**
   * Amount to increment or decrement by.
   */
  by: number,
}

/**
 * Increment a measurement.
 */
export interface IncrementFn {
  (schema: ElasticCommonSchema, measurementName: string, options?: IncDecrOptions): void
}

/**
 * Decrement a measurement.
 */
export interface DecrementFn {
  (schema: ElasticCommonSchema, measurementName: string, options?: IncDecrOptions): void
}

/**
 * Stops a timer.
 */
export interface StopTimerFn {
  (): void
}

/**
 * Measures the time it takes for a block of code to execute.
 */
export interface TimerFn {
  (schema: ElasticCommonSchema, timerName: string, options?: MetricsOptions): StopTimerFn
}

/**
 * Outcome of a context, request, etc.
 */
export enum Outcomes {
  Success = 'success',
  Failure = 'failure',
  Unknown = 'unknown',
}

/**
 * Common identifiers for traces and spans.
 */
export type TraceIdentifiers = {
  name?: string,
  action?: string,
  type?: string,
  subtype?: string,
  startTime?: UnixTimestamp,
}

/**
 * Customizations for starting a span.
 */
export type StartSpan = TraceIdentifiers

/**
 * Customizations for starting a trace (APM transaction).
 */
export type StartTrace = TraceIdentifiers & {
  childOf?: Traceparent,
}

/**
 * Observe options.
 */
export type ObserveOptions = ChildOptions & MetricsOptions & {
  /**
   * Name of the timer (unnecessary if span.name is present).
   */
  name?: string,
}

/**
 * Observe the execution of a block of code.
 */
export interface ObserveFn {
  <T>(schema: ElasticCommonSchema, fn: (ctx: GoobContext) => Promise<T>, options?: ObserveOptions): Promise<T>
}

/**
 * Options to customize the subcontext.
 */
export type ChildOptions = {
  /**
   * Only necessary when originating a trace (APM transaction).  This is will happen when a request
   * is received by a webserver, or job is invoked, etc.
   */
  tracing?: StartTrace,
  span?: StartSpan,
}

/**
 * Options for closing the context.
 */
export type CloseOptions = {
  /**
   * When true, any active transaction associated with this context will be closed.
   * This should generally be done in close proximity to the code that originated the transaction.
   */
  closeTrace?: boolean,
  /**
   * Outcome of the context.  This will be used to enrich a span, and if closeTx is TRUE, the outcome of
   * the transaction,
   */
  outcome?: Outcomes,
}

/**
 * Think off this as a logger, metrics, and trace client all in one.  Its job is to represent
 * the context of the application, or if originated from a request, the context of that request.
 *
 * GoobContext's are hierarchical.  You can create "child" context's by calling the "child" method.
 *
 * @remarks
 *
 * A great discussion about log levels (and their purpose) can be found on
 * {@link https://stackoverflow.com/questions/2031163/when-to-use-the-different-log-levels | StackOverflow}.
 * We are cloning some of the points here to advise people who may not be familiar.
 */
export default interface GoobContext {
  /**
   * Useful to a developer trying to "trace" code execution to better understand what is happening in code.  This
   * level is generally not intended for other consumers (support staff, etc.).
   */
  trace: LogFn,

  /**
   * Information that is diagnostically helpful to people more than just developers (IT, sysadmins, etc.).
   */
  debug: LogFn,

  /**
   * Generally useful information to log (service start/stop, configuration assumptions, etc).
   * Info you want to always have available but usually don't care about under normal circumstances.
   * This is generally the default log level for applications under normal production operation.
   */
  info: LogFn,

  /**
   * Anything that can potentially cause application oddities, but can be automatically recovered from.
   * (Such as switching from a primary to backup server, retrying an operation, missing secondary data, etc.)
   */
  warn: LogFn,

  /**
   * Any error which is fatal to the operation, but not the service or application (can't open a required file,
   * missing data, etc.). These errors will force user (administrator, or direct user) intervention.
   */
  error: LogFn,

  /**
   *  Any error that is forcing a shutdown of the service or application to prevent data loss (or further data loss).
   *  Reserve these only for the most heinous errors and situations where there is guaranteed to have been data
   *  corruption or loss.
   */
  fatal: LogFn,

  /**
   * Represents an instantaneous measurement of something meaningful to the application.
   *
   * @example
   *
   * ctx.gauge('pending_requests', 42);
   */
  gauge: GaugeFn,

  /**
   * Increment a counter.
   *
   * @remarks
   *
   * This method is useful when the application does not want to keep state (as opposed to using a gauge),
   * or the measurement is global (measured across application instances).
   *
   * @example
   *
   * ctx.increment('pending_requests');
   * ctx.increment('pending_requests', { by: 42 });
   */
  increment: IncrementFn,

  /**
   * Decrement a counter.
   *
   * @remarks
   *
   * This method is useful when the application does not want to keep state (as opposed to using a gauge),
   * or the measurement is global (measured across application instances).
   *
   * @example
   *
   * ctx.decrement('pending_requests');
   * ctx.decrement('pending_requests', { by: 42 });
   */
  decrement: DecrementFn,

  /**
   * Start a timer.  This has the same behavior as "Observe", except, the caller is responsible for manually
   * stopping the timer.
   *
   * @example
   *
   * const stop = ctx.startTimer('execute_task');
   * // do stuff
   * stop();
   */
  startTimer: TimerFn,

  /**
   * Executes a function, measuring the time to execute, and if a trace is present in the context, automatically
   * creating a span for the observation.
   */
  observe: ObserveFn

  /**
   * Create a child context, which inherits the metadata of the parent.  When used in combination with "close()",
   * stop watch metrics will be emitted for the timespan between the time child() and close() were called.
   * @param schema
   * @param options
   */
  child(schema: ElasticCommonSchema, options?: ChildOptions): GoobContext,

  /**
   * Close the context, optionally marking the outcome of the context (default is "unknown").
   *
   * Calling this is optional.
   *
   * @param options
   */
  close(options?: CloseOptions): void,
}
