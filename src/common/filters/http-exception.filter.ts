import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'Error';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      errorName = exception.name || 'HttpException';

      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        message = (r.message as string | string[]) ?? (r.error as string) ?? 'Error';
        errorName = (r['error'] as string) || errorName;
      }
    } else if (exception instanceof Error) {
      errorName = exception.name;
      message = exception.message;
    }

    const payload = {
      err: exception instanceof Error ? exception : undefined,
      status,
      method: req.method,
      path: req.url,
      requestId: (req as any).id,
      userId: (req as any).user?.userId,
      email: (req as any).user?.email,
      ip: req.ip,
    };

    this.logger.error(payload, `Request failed: ${errorName}`);

    res.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      method: req.method,
      path: req.url,
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  }
}
