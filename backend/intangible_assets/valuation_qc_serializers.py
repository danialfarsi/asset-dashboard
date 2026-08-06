from rest_framework import serializers
from .valuation_qc_models import QualityControlResult

class QualityControlResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityControlResult
        fields = '__all__'
