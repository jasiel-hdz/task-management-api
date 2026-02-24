import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

/** Create user: name, email, password, role. */
export class CreateUserDto {
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(255)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(255)
  password: string;

  @IsEnum(UserRole, { message: 'Role must be member or administrator' })
  role: UserRole;
}
