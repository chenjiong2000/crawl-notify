#!/usr/bin/env node
import { runDailyTask } from './scheduler/task.js';

const command = process.argv[2];

if (command === 'refresh') {
  console.log('[CLI] 手动执行每日任务...');
  runDailyTask()
    .then(() => {
      console.log('[CLI] 任务完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[CLI] 任务失败:', err);
      process.exit(1);
    });
} else {
  console.log('用法: npm run refresh');
  process.exit(1);
}
