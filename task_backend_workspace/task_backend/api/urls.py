from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health, name='Health'),
    path('tasks/', views.list_tasks, name='task-list'),
    path('tasks/', views.create_task, name='task-create'),
    path('tasks/<int:task_id>/', views.edit_task, name='task-edit'),
    path('tasks/<int:task_id>/', views.partial_edit_task, name='task-partial-edit'),
    path('tasks/<int:task_id>/complete/', views.complete_task, name='task-complete'),
    path('tasks/<int:task_id>/uncomplete/', views.uncomplete_task, name='task-uncomplete'),
    path('tasks/<int:task_id>/', views.delete_task, name='task-delete'),
]
