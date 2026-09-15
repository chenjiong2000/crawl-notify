import cron from 'node-cron';
import { config } from '../config.js';
import { runDailyTask } from './task.js';

export function startScheduler() {
  console.log(`[Scheduler] 定时任务已启动，cron: ${config.cronSchedule}`);

  cron.schedule(config.cronSchedule, async () => {
    console.log('[Scheduler] 定时任务触发...');
    await runDailyTask();
  });
}
