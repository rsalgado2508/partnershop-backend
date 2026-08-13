import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidDateFormat', async: false })
export class IsValidDateFormatConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    // Skip validation if value is falsy (undefined, null, empty string)
    // @IsOptional() will handle these cases
    if (!value) {
      return true;
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Simply check if the format matches YYYY-MM-DD
    // The frontend normalizes all dates to this format
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    return isValid;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} debe estar en formato YYYY-MM-DD`;
  }
}

export function IsValidDateFormat(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDateFormatConstraint,
    });
  };
}
