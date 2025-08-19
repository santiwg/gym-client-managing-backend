import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from './dtos/paginated-response.dto';
import { PaginationDto } from './dtos/pagination.dto';

@Injectable()
export class PaginationService {
    
    getPaginationOptions(pagination: PaginationDto, additionalOptions: any = {}) {
        const options: any = {
            ...additionalOptions  // Incluir opciones adicionales como order
        };

        if (pagination.page !== null) {
            const offset = this.calculateOffset(pagination.page, pagination.quantity);
            options.skip = offset;
            options.take = pagination.quantity;
        }

        //si no hay page, no se agregan las propiedades skip y take
        return options;
    }

    calculateOffset(page: number, quantity: number): number {
        return (page - 1) * quantity;
    }

    // Método para crear la respuesta paginada simplificada
    createPaginatedResponse<T>(
        data: T[], 
        total: number, 
        pagination: PaginationDto
    ): PaginatedResponseDto<T> {
        // Si no hay página especificada, no hay paginación (se devuelven todos los datos)
        if (pagination.page === null) {
            return {
                data,
                hasMore: false  // No hay más páginas porque se devolvieron todos los datos
            };
        }

        // Si hay paginación, calcular si hay más páginas
        const currentPage = pagination.page;
        const pageSize = pagination.quantity;
        const totalPages = Math.ceil(total / pageSize);
        const hasMore = currentPage < totalPages;

        return {
            data,
            hasMore
        };
    }
}
