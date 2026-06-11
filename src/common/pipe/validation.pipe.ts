import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
// import { ZodType } from 'zod';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  constructor() {}

  transform(value) {
    console.log('value', value);
  }
}
