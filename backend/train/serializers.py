from rest_framework import serializers
from .models import Train

class TrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Train
        fields = ['id', 'name','from_station','to_station','departure','arrival','travel_date','travel_class','price','description',]
        
        
        
    