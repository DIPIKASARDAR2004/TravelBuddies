from rest_framework import generics
from .models import Train
from .serializers import TrainSerializer

class TrainListCreateView(generics.ListCreateAPIView):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer

class TrainRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer
    
    
