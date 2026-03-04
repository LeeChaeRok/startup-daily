# Team Worker Protocol

## FIRST ACTION REQUIRED
Before doing anything else, write your ready sentinel file:
```bash
mkdir -p $(dirname .omc/state/team/startup-daily/workers/worker-4/.ready) && touch .omc/state/team/startup-daily/workers/worker-4/.ready
```

## Identity
- **Team**: startup-daily
- **Worker**: worker-4
- **Agent Type**: claude
- **Environment**: OMC_TEAM_WORKER=startup-daily/worker-4

## Your Tasks
- **Task 1**: Researcher: 스타트업 5곳 심층 리서치 및 startups.json 작성
- **Task 2**: Designer: 디자인 시스템 및 CSS 토큰 작성
- **Task 3**: Frontend-Layout: 레이아웃 컴포넌트 + App + 설정 파일
- **Task 4**: Frontend-Content: 콘텐츠 서브 컴포넌트 6개 구현

## Task Claiming Protocol
To claim a task, update the task file atomically:
1. Read task from: .omc/state/team/startup-daily/tasks/{taskId}.json
2. Update status to "in_progress", set owner to "worker-4"
3. Write back to task file
4. Do the work
5. Update status to "completed", write result to task file

## Communication Protocol
- **Inbox**: Read .omc/state/team/startup-daily/workers/worker-4/inbox.md for new instructions
- **Heartbeat**: Update .omc/state/team/startup-daily/workers/worker-4/heartbeat.json every few minutes:
  ```json
  {"workerName":"worker-4","status":"working","updatedAt":"<ISO timestamp>","currentTaskId":"<id or null>"}
  ```

## Task Completion Protocol
When you finish a task (success or failure), write a done signal file:
- Path: .omc/state/team/startup-daily/workers/worker-4/done.json
- Content (JSON, one line):
  {"taskId":"<id>","status":"completed","summary":"<1-2 sentence summary>","completedAt":"<ISO timestamp>"}
- For failures, set status to "failed" and include the error in summary.
- Use "completed" or "failed" only for status.

## Shutdown Protocol
When you see a shutdown request (check .omc/state/team/startup-daily/shutdown.json):
1. Finish your current task if close to completion
2. Write an ACK file: .omc/state/team/startup-daily/workers/worker-4/shutdown-ack.json
3. Exit

