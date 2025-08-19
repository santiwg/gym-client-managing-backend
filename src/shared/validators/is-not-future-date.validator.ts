import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        if (!value) return true; // Si es null/undefined pasa la validación, para los casos donde la propiedad es opcional
        
        const inputDate = new Date(value);
        const now = new Date();

        return inputDate <= now; // Compara si la fecha es igual o anterior a hoy
    }

    defaultMessage(args: ValidationArguments) {
        return 'La fecha no puede ser posterior a la actual (incluyendo horas)'; // Mensaje de error por defecto
    }
}

// 1. Función factory que retorna el decorador
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
    
    // 2. Función decorador que se aplica a la propiedad
    return function (object: Object, propertyName: string) {
        
        // 3. Registrar el decorador en class-validator
        registerDecorator({
            target: object.constructor,     // La clase que contiene la propiedad
            propertyName: propertyName,     // Nombre de la propiedad ('dateTime')
            options: validationOptions,     // Opciones como { message: '...' }
            constraints: [],                // Parámetros extra (vacío en nuestro caso)
            validator: IsNotFutureDateConstraint, // La clase que hace la validación
        });
    };
}