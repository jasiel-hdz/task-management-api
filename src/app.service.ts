import { Injectable } from '@nestjs/common';

/** App-level service (health). Feature logic in UsersModule, TasksModule, AuthModule. */
@Injectable()
export class AppService {
  getHealth(): { app: string; status: string } {
    return { app: 'task-management-api', status: 'ok' };
  }
}
