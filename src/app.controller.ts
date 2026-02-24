import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/** Root routes (e.g. health). Feature routes: /users, /tasks, /auth. */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
