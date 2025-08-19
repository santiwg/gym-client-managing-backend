import { 
    ExceptionFilter, 
    Catch, 
    ArgumentsHost, 
    HttpException, 
    HttpStatus,
    Logger
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch() // Sin parámetros = captura TODAS las excepciones, podría especificarse un tipo de excepcion
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name); //ese parametro es la "etiqueta" o "contexto" del logger, cuando el logger registra un mensaje, muestra de dónde viene

    catch(exception: unknown, host: ArgumentsHost) {
        
        //obtenemos contexto de la peticion
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>(); //objeto Response de Express que representa la respuesta HTTP que se enviará al cliente.
        const request = ctx.getRequest(); //sus datos se usan más abajo

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';

        // Manejo de HttpException (errores de NestJS)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            
            // Si es string: usa el string directamente
            // Si es objeto: extrae la propiedad 'message'
            // Si no hay mensaje: usa mensaje por defecto
            message = typeof exceptionResponse === 'string' 
                ? exceptionResponse                           // ← Caso string
                : (exceptionResponse as any).message          // ← Caso objeto
                  || message;                                 // ← Fallback por defecto
        }
        
        // Manejo de errores de base de datos (TypeORM)
        else if (exception instanceof QueryFailedError) {
            // Errores específicos de base de datos
            const error = exception as any; //Sin as any TypeScript se queja por que exception no tiene 'code' definido explicitamente, viene del driver
            
            // Error de clave duplicada (datos del cliente)
            if (error.code === '23505') {
                status = HttpStatus.BAD_REQUEST; // 400
                message = 'Ya existe un registro con estos datos';
            }
            // Error de clave foránea (datos del cliente)
            else if (error.code === '23503') {
                status = HttpStatus.BAD_REQUEST; // 400
                message = 'No se puede eliminar porque tiene datos relacionados';
            }
            // Error de violación de restricción (datos del cliente)
            else if (error.code === '23514') {
                status = HttpStatus.BAD_REQUEST; // 400
                message = 'Los datos no cumplen las restricciones requeridas';
            }
            // Error genérico de base de datos (problema del servidor)
            else {
                status = HttpStatus.INTERNAL_SERVER_ERROR; // 500
                message = 'Error en la base de datos';
            }
        }

        // Log del error
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`, //Primer parámetro: Mensaje principal
            exception instanceof Error ? exception.stack : exception //Segundo parámetro: Contexto adicional (stack trace o excepción completa)
            // stack trace es la pila de llamadas que muestra exactamente dónde ocurrió el error y cómo se llegó allí
        );

        // Respuesta consistente
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: Array.isArray(message) ? message : [message] //Por si hay errores multiples
        });
    }
}
