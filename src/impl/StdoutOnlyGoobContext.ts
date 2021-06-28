import GoobContext, {
  ChildOptions,
  CloseOptions,
  IncDecrOptions,
  MetricsOptions,
  ObserveOptions, StopTimerFn
} from '../GoobContext';
import { ElasticCommonSchema } from 'ecs-schema';
import BasePinoGoobContext from './BasePinoGoobContext';

export default class StdoutOnlyGoobContext extends BasePinoGoobContext implements GoobContext {

  gauge = (schema: ElasticCommonSchema, gaugeName: string, measurement: number, options?: MetricsOptions): void => {

  }

  increment = (schema: ElasticCommonSchema, measurementName: string, options?: IncDecrOptions): void => {

  }

  decrement = (schema: ElasticCommonSchema, measurementName: string, options?: IncDecrOptions): void => {

  }

  observe = async <T>(
    schema: ElasticCommonSchema,
    fn: (ctx: GoobContext) => Promise<T>,
    options?: ObserveOptions
  ): Promise<T> => {

  }

  startTimer = (schema: ElasticCommonSchema, timerName: string, options?: MetricsOptions): StopTimerFn => {
    const start = Date.now();
    return () => {
      const end = Date.now();
    }
  }

  child(schema: ElasticCommonSchema, options: ChildOptions = {}): GoobContext {
    if (options.tracing) {

    }
    if (options.span) {

    }
    return new StdoutOnlyGoobContext(this.logger.child(schema));
  }

  close(options: CloseOptions = {}): void {
    if (options.closeTrace) {

    }
  }
}
