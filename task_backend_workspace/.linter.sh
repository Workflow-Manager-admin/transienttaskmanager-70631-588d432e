#!/bin/bash
cd /home/kavia/workspace/code-generation/transienttaskmanager-70631-588d432e/task_backend_workspace/task_backend
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

