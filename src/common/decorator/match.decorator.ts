import { registerDecorator, ValidationOptions } from 'class-validator';

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchBetweenFields', async: false })
export class MatchBetweenFields<
  T = any,
> implements ValidatorConstraintInterface {
  validate(value: T, args: ValidationArguments) {
    console.log({ value, args });
    return value == args.object[args.constraints[0]];
  }
  defaultMessage(args?: ValidationArguments) {
    return `fail to match ${args?.property} and ${args?.constraints[0]}`;
  }
}

export function IsMatch<T = any>(
  constraints: string[] = [],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints,
      options: validationOptions,
      validator: MatchBetweenFields<T>,
    });
  };
}
