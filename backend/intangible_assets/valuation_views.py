from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .valuation_models import (
    AssetType, ValuationDimension, ValuationQuestion,
    ValuationScoreGuide, AssetValuation, ValuationAnswer
)
from .valuation_serializers import (
    AssetTypeSerializer, ValuationDimensionSerializer,
    ValuationQuestionSerializer, AssetValuationSerializer,
    AssetValuationCreateSerializer
)
from .models import ScreenedAsset


class AssetTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetType.objects.filter(is_active=True)
    serializer_class = AssetTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class ValuationDimensionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ValuationDimension.objects.all()
    serializer_class = ValuationDimensionSerializer
    permission_classes = [permissions.IsAuthenticated]


class ValuationQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ValuationQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        queryset = ValuationQuestion.objects.all()
        asset_type_id = self.request.query_params.get('asset_type')
        if asset_type_id:
            queryset = queryset.filter(asset_type_id=asset_type_id)
        return queryset.order_by('order')


class AssetValuationViewSet(viewsets.ModelViewSet):
    serializer_class = AssetValuationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AssetValuation.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            queryset = queryset.filter(asset__created_by__organization=user.organization)
        else:
            queryset = queryset.filter(asset__created_by=user)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AssetValuationCreateSerializer
        return AssetValuationSerializer
    
    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """حذف ارزیابی و تمام پاسخ‌های مرتبط"""
        instance = self.get_object()
        # حذف پاسخ‌ها
        ValuationAnswer.objects.filter(valuation=instance).delete()
        # حذف ارزیابی
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        try:
            valuation = self.get_object()
            question_id = request.data.get('question_id')
            score = request.data.get('score')
            evidence = request.data.get('evidence', '')
            notes = request.data.get('notes', '')
            
            if not question_id or score is None:
                return Response(
                    {'error': 'question_id و score الزامی هستند'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                question = ValuationQuestion.objects.get(id=question_id)
            except ValuationQuestion.DoesNotExist:
                return Response(
                    {'error': 'سوال یافت نشد'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            answer, created = ValuationAnswer.objects.update_or_create(
                valuation=valuation,
                question=question,
                defaults={
                    'score': score,
                    'evidence': evidence,
                    'notes': notes,
                }
            )
            
            valuation.calculate_final_score()
            
            return Response({
                'success': True,
                'message': 'پاسخ ثبت شد',
                'final_score': valuation.final_score,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        valuation = self.get_object()
        answers = valuation.answers.all()
        
        dim_scores = {}
        total_score = 0
        
        for answer in answers:
            if answer.score is not None:
                dim = answer.question.dimension.name
                if dim not in dim_scores:
                    dim_scores[dim] = {'total': 0, 'count': 0}
                dim_scores[dim]['total'] += answer.score
                dim_scores[dim]['count'] += 1
                total_score += answer.score
        
        for dim in dim_scores:
            if dim_scores[dim]['count'] > 0:
                dim_scores[dim]['average'] = dim_scores[dim]['total'] / dim_scores[dim]['count']
            else:
                dim_scores[dim]['average'] = 0
        
        return Response({
            'id': valuation.id,
            'asset': valuation.asset.asset_name,
            'asset_uid': valuation.asset.asset_uid,
            'status': valuation.status,
            'final_score': valuation.final_score,
            'strategic_score': valuation.strategic_score,
            'technical_score': valuation.technical_score,
            'operational_score': valuation.operational_score,
            'market_score': valuation.market_score,
            'risk_score': valuation.risk_score,
            'dimensions': dim_scores,
            'total_questions': 23,
            'answered_questions': answers.filter(score__isnull=False).count(),
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        valuation = self.get_object()
        
        if not valuation.asset_type:
            valuation.asset_type_id = 1
            valuation.save()
        
        total_questions = ValuationQuestion.objects.filter(
            asset_type=valuation.asset_type
        ).count()
        
        if total_questions == 0:
            total_questions = 23
        
        answered = valuation.answers.filter(score__isnull=False).count()
        
        if answered < total_questions:
            return Response(
                {
                    'error': f'همه سوالات پاسخ داده نشده‌اند. {answered}/{total_questions}',
                    'remaining': total_questions - answered
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valuation.status = 'completed'
        valuation.save()
        valuation.calculate_final_score()
        
        return Response({
            'success': True,
            'message': 'ارزیابی تکمیل شد',
            'final_score': valuation.final_score
        })
