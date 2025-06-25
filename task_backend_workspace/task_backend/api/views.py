from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, serializers
from typing import List, Dict
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


# PUBLIC_INTERFACE
class TaskSerializer(serializers.Serializer):
    """
    Serializer for the Task.
    """
    id = serializers.IntegerField(read_only=True, help_text="Unique ID for the task")
    title = serializers.CharField(help_text="Title or description of the task")
    completed = serializers.BooleanField(default=False, help_text="Task completion status")


# Singleton in-memory task list manager
class TaskManager:
    _instance = None
    _tasks: List[Dict] = []
    _id_counter: int = 1

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TaskManager, cls).__new__(cls)
            cls._tasks = []
            cls._id_counter = 1
        return cls._instance

    def list_tasks(self):
        return self._tasks

    def add_task(self, title: str):
        task = {"id": self._id_counter, "title": title, "completed": False}
        self._tasks.append(task)
        self._id_counter += 1
        return task

    def get_task(self, task_id: int):
        for task in self._tasks:
            if task['id'] == task_id:
                return task
        return None

    def update_task(self, task_id: int, title: str = None, completed: bool = None):
        task = self.get_task(task_id)
        if task:
            if title is not None:
                task['title'] = title
            if completed is not None:
                task['completed'] = completed
            return task
        return None

    def delete_task(self, task_id: int):
        global_idx = None
        for idx, task in enumerate(self._tasks):
            if task['id'] == task_id:
                global_idx = idx
                break
        if global_idx is not None:
            del self._tasks[global_idx]
            return True
        return False


task_manager = TaskManager()


# ----------------------- API Views -----------------------

# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='get',
    operation_summary="List all tasks",
    responses={200: TaskSerializer(many=True)},
    tags=['Tasks'],
)
@swagger_auto_schema(
    method='post',
    operation_summary="Create a new task",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['title'],
        properties={
            'title': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='The description or title of the new task'
            ),
        },
    ),
    responses={
        201: TaskSerializer,
        400: "Missing or invalid request body",
    },
    tags=['Tasks'],
)
@api_view(['GET', 'POST'])
def tasks_collection(request):
    """
    GET: Returns a list of all tasks.
    POST: Create a new task.
      - JSON Body:
          - title: string
    """
    if request.method == 'GET':
        return Response(TaskSerializer(task_manager.list_tasks(), many=True).data)
    elif request.method == 'POST':
        serializer = TaskSerializer(data=request.data)
        if 'title' not in request.data:
            return Response({'error': 'Title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if serializer.is_valid() or 'title' in request.data:
            created = task_manager.add_task(title=request.data['title'])
            return Response(
                TaskSerializer(created).data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='put',
    operation_summary="Edit or replace a task",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['title'],
        properties={
            'title': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='The new task title'
            ),
        },
    ),
    responses={200: TaskSerializer, 404: "Task not found"},
    tags=['Tasks'],
)
@api_view(['PUT'])
def edit_task(request, task_id: int):
    """
    Edit the title of a task.
    """
    task = task_manager.get_task(task_id)
    if not task:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = TaskSerializer(data={"id": task_id, **request.data, "completed": task['completed']})
    if serializer.is_valid():
        task_manager.update_task(task_id, title=request.data['title'])
        updated = task_manager.get_task(task_id)
        return Response(TaskSerializer(updated).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='patch',
    operation_summary="Edit or partially update a task",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'title': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='The new task title'
            ),
        },
    ),
    responses={200: TaskSerializer, 404: "Task not found"},
    tags=['Tasks'],
)
@api_view(['PATCH'])
def partial_edit_task(request, task_id: int):
    """
    Partially update a task (currently only supports title).
    """
    task = task_manager.get_task(task_id)
    if not task:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    title = request.data.get("title", None)
    updated = task_manager.update_task(task_id, title=title)
    return Response(TaskSerializer(updated).data)


# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='post',
    operation_summary="Mark a task as completed",
    responses={200: TaskSerializer, 404: "Task not found"},
    tags=['Tasks'],
)
@api_view(['POST'])
def complete_task(request, task_id: int):
    """
    Mark a task as completed.
    """
    updated = task_manager.update_task(task_id, completed=True)
    if not updated:
        return Response(
            {'error': 'Task not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(TaskSerializer(updated).data)


# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='post',
    operation_summary="Mark a task as incomplete",
    responses={200: TaskSerializer, 404: "Task not found"},
    tags=['Tasks'],
)
@api_view(['POST'])
def uncomplete_task(request, task_id: int):
    """
    Mark a task as incomplete.
    """
    updated = task_manager.update_task(task_id, completed=False)
    if not updated:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(TaskSerializer(updated).data)


# PUBLIC_INTERFACE
@swagger_auto_schema(
    method='delete',
    operation_summary="Delete a task",
    responses={204: "Task deleted", 404: "Task not found"},
    tags=['Tasks'],
)
@api_view(['DELETE'])
def delete_task(request, task_id: int):
    """
    Delete a task.
    """
    deleted = task_manager.delete_task(task_id)
    if not deleted:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


# Health endpoint for ci/test
@api_view(['GET'])
def health(request):
    return Response({"message": "Server is up!"})
