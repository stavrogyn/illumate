import { Inject } from '@nestjs/common'
import { LOGGER_TOKEN } from './logger.service'

/**
 * Decorator to inject the observability logger
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@InjectLogger() private readonly logger: LoggerService) {}
 * }
 * ```
 */
export const InjectLogger = () => Inject(LOGGER_TOKEN)

