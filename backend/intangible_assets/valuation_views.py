from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
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
        try:
            asset = serializer.validated_data.get('asset')
            asset_type = serializer.validated_data.get('asset_type')
            
            if not asset_type and asset:
                asset_type = getattr(asset, 'asset_type', None)
            
            if not asset_type and asset and hasattr(asset, 'asset_uid'):
                asset_type = self._detect_asset_type_from_uid(asset.asset_uid)
            
            serializer.save(
                evaluated_by=self.request.user,
                asset_type=asset_type
            )
        except Exception as e:
            print(f"❌ Error in perform_create: {e}")
            raise

    def _detect_asset_type_from_uid(self, asset_uid):
        from .models import ScreenedAsset
        from .valuation_models import AssetType
        code_map = {
            "BRD": "BRAND",
            "CON": "CONTRACT",
            "BMC": "BMC",
            "FRM": "FORMULA",
            "GWD": "GOODWILL",
            "PRT": "PORTFOLIO",
        }
        parts = asset_uid.split("-")
        if len(parts) >= 3:
            sub_code = parts[2]
            asset_code = code_map.get(sub_code)
            if asset_code:
                try:
                    return AssetType.objects.get(code=asset_code)
                except AssetType.DoesNotExist:
                    pass
        return None
    
    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                instance = self.get_object()
                ValuationAnswer.objects.filter(valuation=instance).delete()
                self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        try:
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
            
            organization_type = getattr(request.user, 'organization_type', 'manufacturing')
            if not organization_type:
                organization_type = 'manufacturing'
            
            weighted_summary = valuation.get_score_summary(organization_type)
            
            return Response({
                'id': valuation.id,
                'asset': valuation.asset.asset_name,
                'asset_uid': valuation.asset.asset_uid,
                'status': valuation.status,
                'final_score': valuation.final_score,
                'weighted_score': weighted_summary['final_score'],
                'strategic_score': valuation.strategic_score,
                'technical_score': valuation.technical_score,
                'operational_score': valuation.operational_score,
                'market_score': valuation.market_score,
                'risk_score': valuation.risk_score,
                'dimensions': dim_scores,
                'total_questions': 23,
                'answered_questions': answers.filter(score__isnull=False).count(),
                'weighted_summary': weighted_summary,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        try:
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
            
            organization_type = getattr(request.user, 'organization_type', 'manufacturing')
            if not organization_type:
                organization_type = 'manufacturing'
            weighted_score = valuation.calculate_weighted_score(organization_type)
            
            return Response({
                'success': True,
                'message': 'ارزیابی تکمیل شد',
                'final_score': valuation.final_score,
                'weighted_score': weighted_score,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def weighted_score(self, request, pk=None):
        try:
            valuation = self.get_object()
            user = request.user
            
            org_type = getattr(user, 'organization_type', 'manufacturing')
            if not org_type:
                org_type = 'manufacturing'
            
            final_score = valuation.calculate_weighted_score(org_type)
            summary = valuation.get_score_summary(org_type)
            
            return Response({
                'valuation_id': valuation.id,
                'asset_name': valuation.asset.asset_name,
                'asset_uid': valuation.asset.asset_uid,
                'organization_type': org_type,
                'final_score': final_score,
                'summary': summary,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def submit_answer_with_evidence(self, request, pk=None):
        """ثبت پاسخ با شواهد فایل"""
        try:
            valuation = self.get_object()
            question_id = request.data.get('question_id')
            score = request.data.get('score')
            evidence = request.data.get('evidence', '')
            notes = request.data.get('notes', '')
            
            # فایل‌های شواهد
            evidence_interview = request.FILES.get('evidence_interview')
            evidence_document = request.FILES.get('evidence_document')
            evidence_process = request.FILES.get('evidence_process')
            evidence_database = request.FILES.get('evidence_database')
            
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
            
            # ایجاد یا به‌روزرسانی پاسخ
            answer, created = ValuationAnswer.objects.update_or_create(
                valuation=valuation,
                question=question,
                defaults={
                    'score': score,
                    'evidence': evidence,
                    'notes': notes,
                }
            )
            
            # ذخیره فایل‌ها
            if evidence_interview:
                answer.evidence_interview = evidence_interview
            if evidence_document:
                answer.evidence_document = evidence_document
            if evidence_process:
                answer.evidence_process = evidence_process
            if evidence_database:
                answer.evidence_database = evidence_database
            answer.save()
            
            valuation.calculate_final_score()
            
            return Response({
                'success': True,
                'message': 'پاسخ با شواهد ثبت شد',
                'final_score': valuation.final_score,
                'answer_id': answer.id,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
