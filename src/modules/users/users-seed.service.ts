import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/** Creates admin user on app start when ADMIN_EMAIL and ADMIN_PASSWORD are set and no user with that email exists. */
@Injectable()
export class UsersSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name: 'Admin',
      email,
      password: hashed,
      role: UserRole.ADMINISTRATOR,
    });
    await this.userRepository.save(user);
    console.log('[Seed] Admin user created:', email);
  }
}
