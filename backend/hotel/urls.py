from django.urls import path
from .views import HotelListCreateView, HotelRetrieveUpdateDeleteView

urlpatterns = [
    path('hotels/', HotelListCreateView.as_view(), name='hotel-list-create'),
    path('hotels/<int:pk>/', HotelRetrieveUpdateDeleteView.as_view(), name='hotel-detail'),
]