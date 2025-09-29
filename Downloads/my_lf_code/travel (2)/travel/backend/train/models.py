from django.db import models

class Train(models.Model):
    name = models.CharField(max_length=200)
    from_station = models.CharField(max_length=200)
    to_station = models.CharField(max_length=200)
    departure = models.TimeField(null=True, blank=True)
    arrival = models.TimeField(null=True, blank=True)
    travel_date = models.DateField(null=True, blank=True)
    travel_class = models.CharField(max_length=50, default='All')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.from_station} → {self.to_station})"