from django.urls import path
from .views import TrainListCreateView, TrainRetrieveUpdateDeleteView

urlpatterns = [
    path('trains/', TrainListCreateView.as_view(), name='train-list'),
    path('trains/<int:pk>/', TrainRetrieveUpdateDeleteView.as_view(), name='train-detail'),
]