import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO for creating a user.
 * Challenge: name, email, role (member or administrator).
 */
export class CreateUserDto {
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(255)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole, { message: 'Role must be member or administrator' })
  role: UserRole;
}
