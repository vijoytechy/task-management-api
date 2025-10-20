import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodType, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType<any, any, any>) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      // Zod v4 uses `issues` instead of `errors`
      const message = result.error.issues
        .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      throw new BadRequestException(`Validation failed: ${message}`);
    }

    return result.data;
  }
}
