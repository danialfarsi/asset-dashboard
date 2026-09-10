from rest_framework import serializers
from .viam_08_models import *


class KnowledgeExtractionSerializer(serializers.ModelSerializer):
    key_person_name = serializers.CharField(source='key_person.get_full_name', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.get_full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    knowledge_type_display = serializers.CharField(source='get_knowledge_type_display', read_only=True)
    
    class Meta:
        model = KnowledgeExtraction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class LessonsLearnedSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = LessonsLearned
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'view_count']


class KnowledgeTransferSerializer(serializers.ModelSerializer):
    from_person_name = serializers.CharField(source='from_person.get_full_name', read_only=True)
    to_person_name = serializers.CharField(source='to_person.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = KnowledgeTransfer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
