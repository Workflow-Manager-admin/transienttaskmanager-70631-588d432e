#!/bin/bash
cd /home/kavia/workspace/code-generation/transienttaskmanager-70631-588d432e/task_frontend_workspace/task_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

