import { Injectable } from '@nestjs/common';
import { nodeUser } from '@scouts/user-node';
import { Log } from '@scouts/logger-node';

@Injectable()
export class AppService {

	@Log({ level: 'info', includeResult: true })
	getData(): { message: string } {
		const user = nodeUser();
		const loggerInfo = 'logger-node';
		return { message: `${user} - ${loggerInfo}` };
	}
}
