export class PaginatedResponseDto<T> {
    data: T[];
    hasMore: boolean;
}
