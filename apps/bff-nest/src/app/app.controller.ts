import { Controller, Get } from '@nestjs/common';
import { Log } from '@scouts/logger-node';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@Log({ level: 'info', includeResult: true })
	getData() {
		return this.appService.getData();
	}
}
