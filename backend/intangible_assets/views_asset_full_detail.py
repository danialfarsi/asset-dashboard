from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import ScreenedAsset, AssetFile
from .valuation_models import AssetValuation, ValuationCase
from .valuation_step4_models import ValuationStep4
from .valuation_qc_models import QualityControlResult
from .valuation_sensitivity_models import SensitivityAnalysis


class AssetFullDetailView(APIView):
    """
    GET /api/intangible/assets/{id}/full-detail/
    همه اطلاعات دارایی با یه API call (بهینه)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, asset_id):
        user = request.user
        
        # دریافت دارایی
        try:
            asset = ScreenedAsset.objects.select_related(
                'organization', 'department', 'created_by', 'asset_type'
            ).get(id=asset_id)
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)
        
        # چک دسترسی
        if user.role == 'org_admin' and asset.organization_id != user.organization_id:
            return Response({'error': 'دسترسی ندارید'}, status=403)
        if user.role == 'org_user':
            if asset.department_id != user.department_id and asset.created_by_id != user.id:
                return Response({'error': 'دسترسی ندارید'}, status=403)
        
        # ═══════════════════════════════════════════════
        # ۱. دارایی
        # ═══════════════════════════════════════════════
        asset_data = {
            'id': asset.id,
            'asset_name': asset.asset_name,
            'asset_uid': asset.asset_uid,
            'category': asset.category,
            'result': asset.result,
            'description': asset.description or '',
            'notes': asset.notes or '',
            'version': asset.version,
            'discovery_date': asset.discovery_date,
            'created_at': asset.created_at,
            'updated_at': asset.updated_at,
            'valuation_method': asset.valuation_method,
            'is_approved_for_valuation': asset.is_approved_for_valuation,
            'created_by_name': (
                f"{asset.created_by.first_name} {asset.created_by.last_name}".strip()
                if asset.created_by else 'نامشخص'
            ),
            'organization_name': asset.organization.name if asset.organization else None,
            'department_name': asset.department.name if asset.department else None,
            'created_by': {
                'id': asset.created_by.id,
                'email': asset.created_by.email,
                'first_name': asset.created_by.first_name,
                'last_name': asset.created_by.last_name,
                'role': asset.created_by.role,
            } if asset.created_by else None,
            'asset_type': {
                'id': asset.asset_type.id,
                'code': asset.asset_type.code,
                'name': asset.asset_type.name,
            } if asset.asset_type else None,
        }
        
        # ═══════════════════════════════════════════════
        # ۲. فایل‌ها
        # ═══════════════════════════════════════════════
        files = AssetFile.objects.filter(asset=asset).select_related('uploaded_by')
        files_data = [{
            'id': f.id,
            'asset': f.asset_id,
            'file_type': f.file_type,
            'file_type_label': f.get_file_type_display() if hasattr(f, 'get_file_type_display') else f.file_type,
            'title': f.title,
            'file': f.file.url if f.file else None,
            'description': f.description or '',
            'uploaded_by_name': (
                f"{f.uploaded_by.first_name} {f.uploaded_by.last_name}".strip()
                if f.uploaded_by else 'نامشخص'
            ),
            'uploaded_at': f.uploaded_at,
        } for f in files]
        
        # ═══════════════════════════════════════════════
        # ۳. Protection Profile
        # ═══════════════════════════════════════════════
        protection_data = None
        try:
            from .protection_models import ProtectionProfile
            profile = ProtectionProfile.objects.filter(asset=asset).first()
            if profile:
                protection_data = {
                    'id': profile.id,
                    'archetype': profile.archetype,
                    'archetype_display': profile.get_archetype_display() if hasattr(profile, 'get_archetype_display') else profile.archetype,
                    'status': profile.status,
                    'status_display': profile.get_status_display() if hasattr(profile, 'get_status_display') else profile.status,
                    'protection_score': float(profile.protection_score or 0),
                    'legal_score': float(profile.legal_score or 0),
                    'technical_score': float(profile.technical_score or 0),
                    'created_at': profile.created_at,
                    'updated_at': profile.updated_at,
                }
        except Exception as e:
            print(f"Protection error: {e}")
        
        # ═══════════════════════════════════════════════
        # ۴. Valuation Case + Step4 + QC + Sensitivity
        # ═══════════════════════════════════════════════
        valuation_case = ValuationCase.objects.filter(asset=asset).first()
        
        financial_data = None
        qc_data = None
        sensitivity_data = None
        valuation_case_id = None
        
        if valuation_case:
            valuation_case_id = valuation_case.id
            
            # Step4
            step4 = ValuationStep4.objects.filter(valuation_case=valuation_case).first()
            if step4:
                financial_data = {
                    'final_value': float(step4.final_value or 0),
                    'token_value': float(step4.token_value or 0),
                    'confidence_level': float(getattr(step4, 'confidence_level', 0) or 0),
                    'qc_score': float(getattr(step4, 'qc_score', 0) or 0),
                    'method_id': getattr(step4, 'method_id', '') or asset.valuation_method or 'M-01',
                    'step4_status': getattr(step4, 'step4_status', 'DRAFT'),
                    'calculation_details': getattr(step4, 'calculation_details', {}),
                    'effective_date': step4.updated_at or step4.created_at,
                }
            
            # QC
            try:
                qc = QualityControlResult.objects.filter(valuation_case=valuation_case).first()
                if qc:
                    qc_data = {
                        'id': qc.id,
                        'completeness_score': float(qc.completeness_score or 0),
                        'total_rules': qc.total_rules or 0,
                        'passed': qc.passed or 0,
                        'warnings': qc.warnings or 0,
                        'errors': qc.errors or 0,
                        'decision': qc.decision or 'PENDING',
                    }
            except Exception as e:
                print(f"QC error: {e}")
            
            # Sensitivity
            try:
                sens = SensitivityAnalysis.objects.filter(valuation_case=valuation_case).first()
                if sens:
                    sensitivity_data = {
                        'id': sens.id,
                        'base_value': float(sens.base_value or 0),
                        'min_value': float(sens.min_value or 0),
                        'max_value': float(sens.max_value or 0),
                        'confidence_level': float(sens.confidence_level or 0),
                        'critical_drivers': sens.critical_drivers or [],
                    }
            except Exception as e:
                print(f"Sensitivity error: {e}")
        
        # ═══════════════════════════════════════════════
        # ۵. Valuation (summary)
        # ═══════════════════════════════════════════════
        valuation_data = None
        valuations = AssetValuation.objects.filter(asset=asset).order_by('-evaluated_at')
        
        if valuations.exists():
            completed = valuations.filter(status='completed').first()
            target = completed or valuations.first()
            
            try:
                # محاسبه summary
                answers = target.answers.all().select_related('question', 'question__dimension')
                
                dim_scores = {}
                for answer in answers:
                    if answer.score is not None:
                        dim = answer.question.dimension.name
                        if dim not in dim_scores:
                            dim_scores[dim] = {'total': 0, 'count': 0}
                        dim_scores[dim]['total'] += answer.score
                        dim_scores[dim]['count'] += 1
                
                for dim in dim_scores:
                    if dim_scores[dim]['count'] > 0:
                        dim_scores[dim]['average'] = dim_scores[dim]['total'] / dim_scores[dim]['count']
                    else:
                        dim_scores[dim]['average'] = 0
                
                org_type = getattr(user, 'organization_type', 'manufacturing') or 'manufacturing'
                try:
                    weighted = target.get_score_summary(org_type)
                except:
                    weighted = None
                
                valuation_data = {
                    'id': target.id,
                    'status': target.status,
                    'final_score': float(weighted.get('final_score', 0)) if weighted else float(target.final_score or 0),
                    'strategic_score': float(weighted.get('averages', {}).get('strategic', 0)) if weighted else 0,
                    'technical_score': float(weighted.get('averages', {}).get('technical', 0)) if weighted else 0,
                    'operational_score': float(weighted.get('averages', {}).get('operational', 0)) if weighted else 0,
                    'market_score': float(weighted.get('averages', {}).get('market', 0)) if weighted else 0,
                    'risk_score': float(weighted.get('averages', {}).get('risk', 0)) if weighted else 0,
                    'answered_questions': weighted.get('answered_questions', 0) if weighted else 0,
                    'total_questions': weighted.get('total_questions', 23) if weighted else 23,
                }
            except Exception as e:
                print(f"Valuation summary error: {e}")
        
        return Response({
            'asset': asset_data,
            'files': files_data,
            'protection_profile': protection_data,
            'valuation_case_id': valuation_case_id,
            'financial_data': financial_data,
            'qc_data': qc_data,
            'sensitivity_data': sensitivity_data,
            'valuation': valuation_data,
        })
