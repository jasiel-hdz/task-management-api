import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO for listing users with optional filters: name, email, role.
 * All filters are optional and can be combined.
 */
export class QueryUsersDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be member or administrator' })
  role?: UserRole;
}
