from django.contrib import admin
from .models import Train

@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ('name', 'from_station', 'to_station', 'travel_date', 'price')