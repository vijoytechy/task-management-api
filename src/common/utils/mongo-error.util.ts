import { BadRequestException, ConflictException } from '@nestjs/common';

type AnyLogger = { error: (...args: any[]) => unknown } | undefined;

export function mapMongoError(err: any, logger?: AnyLogger): never {
  try {

    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      throw new ConflictException(`Duplicate value for ${field}`);
    }

  
    if (err?.name === 'CastError') {
      const target = err?.path || 'identifier';
      throw new BadRequestException(`Invalid ${target}`);
    }


    if (err?.name === 'ValidationError' && err?.errors) {
      const messages = Object.values(err.errors)
        .map((e: any) => e?.message)
        .filter(Boolean);
      const message = messages.length ? messages.join(', ') : 'Validation failed';
      throw new BadRequestException(message);
    }

 
    logger?.error(err?.message || err, (err as any)?.stack);
    throw new BadRequestException('Request failed');
  } catch (mapped) {
    
    throw mapped;
  }
}

