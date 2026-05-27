from django.urls import path
from .views import BusListCreateView, BusRetrieveUpdateDeleteView

urlpatterns = [
    path('buses/', BusListCreateView.as_view(), name='bus-list-create'),
    path('buses/<int:pk>/', BusRetrieveUpdateDeleteView.as_view(), name='bus-detail'),
]