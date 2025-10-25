import { Injectable } from '@nestjs/common';
import { Log } from '@scouts/logger-node';
import { nodeUser } from '@scouts/user-node';

@Injectable()
export class AppService {
	@Log({ level: 'info', includeResult: true })
	getData(): { message: string } {
		const user = nodeUser();
		const loggerInfo = 'logger-node';
		return { message: `${user} - ${loggerInfo}` };
	}
}
