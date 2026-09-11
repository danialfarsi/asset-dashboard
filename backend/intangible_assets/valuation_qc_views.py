
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .valuation_qc_models import QualityControlResult
from .valuation_qc_serializers import QualityControlResultSerializer
from .valuation_models import ValuationCase


class QualityControlViewSet(viewsets.ModelViewSet):
    serializer_class = QualityControlResultSerializer
    permission_classes = [IsAuthenticated]
    queryset = QualityControlResult.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        valuation_case = self.request.query_params.get('valuation_case')
        if valuation_case:
            queryset = queryset.filter(valuation_case_id=valuation_case)
        return queryset
    
    @action(detail=False, methods=['post'])
    def save_result(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _check_document(self, case, field_name, label, evidence_types=None):
        """
        چک می‌کند که آیا سند در یکی از این ۳ منبع وجود دارد:
        1. فیلد مستقیم ValuationCase (مثل case.asset_description_doc)
        2. ValuationStep3Evidence (فایل‌های آپلود شده در Step3)
        3. AssetFile (فایل‌های آپلود شده برای دارایی)
        """
        # ۱. فیلد مستقیم ValuationCase
        if getattr(case, field_name, None):
            return {'exists': True, 'source': 'case_field'}
        
        # ۲. ValuationStep3Evidence
        if evidence_types:
            try:
                step3 = case.step3_data
                if step3.evidences.filter(evidence_type__in=evidence_types).exists():
                    return {'exists': True, 'source': 'step3_evidence'}
            except Exception:
                pass
        
        # ۳. AssetFile
        try:
            from .models import AssetFile
            if AssetFile.objects.filter(asset=case.asset).exists():
                return {'exists': True, 'source': 'asset_file'}
        except Exception:
            pass
        
        return {'exists': False, 'source': None}
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """
        چک‌های کامل پرونده از دید QC
        """
        try:
            case_id = request.data.get('valuation_case')
            if not case_id:
                return Response(
                    {'error': 'valuation_case الزامی است'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            case = ValuationCase.objects.get(id=case_id)
        except ValuationCase.DoesNotExist:
            return Response(
                {'error': 'ValuationCase یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        passed = []
        issues = []
        warnings = []
        
        # ═══════════════════════════════════════
        # ۱. اسناد اجباری - چک از ۳ منبع
        # ═══════════════════════════════════════
        required_docs = [
            ('asset_description_doc', 'مستندات توصیف دارایی', 
             ['m01_asset_description', 'm02_asset_description', 'm03_asset_description',
              'm04_asset_description', 'm05_asset_description', 'm06_asset_description',
              'm07_asset_description', 'm08_asset_description', 'm09_asset_description']),
            ('ownership_doc', 'سند مالکیت', 
             ['m01_ownership', 'm02_ownership', 'ownership']),
            ('financial_source_doc', 'منبع مالی', 
             ['m01_revenue', 'm02_revenue', 'm03_revenue', 'm04_revenue',
              'm05_revenue', 'm06_revenue', 'm07_revenue', 'm08_revenue', 'm09_revenue',
              'revenue_file']),
        ]
        
        for field, label, ev_types in required_docs:
            result = self._check_document(case, field, label, ev_types)
            if result['exists']:
                source_label = {
                    'case_field': 'بارگذاری شده (مستقیم)',
                    'step3_evidence': 'بارگذاری شده (شواهد Step3)',
                    'asset_file': 'بارگذاری شده (فایل‌های دارایی)',
                }.get(result['source'], 'بارگذاری شده')
                passed.append({
                    'field': field,
                    'label': label,
                    'message': source_label,
                })
            else:
                issues.append({
                    'field': field,
                    'label': label,
                    'message': f'{label} بارگذاری نشده است',
                    'hint': f'در Step2 یا Step3، {label} را بارگذاری کنید',
                    'severity': 'blocking',
                })
        
        # ═══════════════════════════════════════
        # ۲. سند معیار خارجی برای روش‌های درآمدی
        # ═══════════════════════════════════════
        income_methods = ['M-01', 'M-02', 'M-03', 'M-04']
        if case.valuation_method in income_methods:
            benchmark_types = [
                'm01_benchmark', 'm02_benchmark', 'm03_benchmark', 'm04_benchmark',
                'benchmark_report', 'external_benchmark'
            ]
            result = self._check_document(case, 'external_benchmark_doc', 'فایل معیار صنعت', benchmark_types)
            if result['exists']:
                source_label = {
                    'case_field': 'بارگذاری شده (مستقیم)',
                    'step3_evidence': 'بارگذاری شده (شواهد Step3)',
                    'asset_file': 'بارگذاری شده (فایل‌های دارایی)',
                }.get(result['source'], 'بارگذاری شده')
                passed.append({
                    'field': 'external_benchmark_doc',
                    'label': 'فایل معیار صنعت',
                    'message': source_label,
                })
            else:
                issues.append({
                    'field': 'external_benchmark_doc',
                    'label': 'فایل معیار صنعت',
                    'message': f'برای روش {case.valuation_method} الزامی است',
                    'hint': 'در Step3، فایل معیار صنعت را بارگذاری کنید',
                    'severity': 'blocking',
                })
        
        # ═══════════════════════════════════════
        # ۳. فرضیات
        # ═══════════════════════════════════════
        assumptions_count = case.assumptions.count()
        if assumptions_count == 0:
            issues.append({
                'field': 'assumptions',
                'label': 'مفروضات عمومی',
                'message': 'حداقل ۱ فرضیه لازم است',
                'hint': 'در Step2 → بخش فرضیات، حداقل یک فرضیه اضافه کنید',
                'severity': 'blocking',
            })
        else:
            passed.append({
                'field': 'assumptions',
                'label': f'مفروضات عمومی ({assumptions_count})',
                'message': 'ثبت شده',
            })
        
        # ═══════════════════════════════════════
        # ۴. Source Reliability
        # ═══════════════════════════════════════
        reliability_levels = {'very_low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5}
        min_reliability = 3
        current = reliability_levels.get(case.source_reliability, 0)
        if current < min_reliability:
            warnings.append({
                'field': 'source_reliability',
                'label': 'قابلیت اتکای منبع',
                'message': f'سطح فعلی: {case.source_reliability} — حداقل: medium',
                'hint': 'در Step2، قابلیت اتکای منبع را افزایش دهید',
                'severity': 'warning',
            })
        else:
            passed.append({
                'field': 'source_reliability',
                'label': 'قابلیت اتکای منبع',
                'message': 'قابل قبول',
            })
        
        # ═══════════════════════════════════════
        # ۵. Step3
        # ═══════════════════════════════════════
        try:
            step3 = case.step3_data
            if step3.validation_status in ['VALIDATED', 'APPROVED']:
                passed.append({
                    'field': 'step3',
                    'label': 'پارامترهای ارزش‌گذاری (Step3)',
                    'message': 'تأیید شده',
                })
            else:
                issues.append({
                    'field': 'step3',
                    'label': 'پارامترهای ارزش‌گذاری (Step3)',
                    'message': f'وضعیت: {step3.validation_status}',
                    'hint': 'در Step3، پارامترها را تکمیل و تأیید کنید',
                    'severity': 'blocking',
                })
        except Exception:
            issues.append({
                'field': 'step3',
                'label': 'پارامترهای ارزش‌گذاری (Step3)',
                'message': 'ثبت نشده است',
                'hint': 'در Step3، پارامترهای روش را وارد کنید',
                'severity': 'blocking',
            })
        
        # ═══════════════════════════════════════
        # ۶. Step4
        # ═══════════════════════════════════════
        try:
            step4 = case.step4_data
            if step4.step4_status in ['CALCULATED', 'APPROVED'] and float(step4.final_value or 0) != 0:
                passed.append({
                    'field': 'step4',
                    'label': 'محاسبه ارزش (Step4)',
                    'message': 'محاسبه‌شده',
                })
            else:
                issues.append({
                    'field': 'step4',
                    'label': 'محاسبه ارزش (Step4)',
                    'message': 'محاسبه انجام نشده یا مقدار صفر',
                    'hint': 'در Step4، محاسبه را انجام دهید',
                    'severity': 'blocking',
                })
        except Exception:
            issues.append({
                'field': 'step4',
                'label': 'محاسبه ارزش (Step4)',
                'message': 'محاسبه نشده است',
                'hint': 'در Step4، دکمه محاسبه را بزنید',
                'severity': 'blocking',
            })
        
        # ═══════════════════════════════════════
        # تصمیم نهایی
        # ═══════════════════════════════════════
        blocking_count = len(issues)
        total_checks = len(passed) + blocking_count + len(warnings)
        completeness = int(100 * len(passed) / max(1, total_checks))
        
        if blocking_count > 0:
            decision = 'RETURN'
        elif len(warnings) > 0:
            decision = 'CONDITIONAL'
        else:
            decision = 'APPROVE'
        
        can_proceed = decision in ['APPROVE', 'CONDITIONAL']
        
        try:
            QualityControlResult.objects.update_or_create(
                valuation_case=case,
                defaults={
                    'method_id': case.valuation_method or 'N/A',
                    'completeness_score': completeness,
                    'total_rules': total_checks,
                    'passed': len(passed),
                    'warnings': len(warnings),
                    'errors': blocking_count,
                    'blocking_issues': blocking_count,
                    'decision': decision,
                    'reviewer_comment': f'{len(passed)} مورد تأیید، {blocking_count} مورد نیاز به اصلاح، {len(warnings)} هشدار',
                    'qc_data': {
                        'passed': passed,
                        'issues': issues,
                        'warnings': warnings,
                    },
                }
            )
        except Exception as e:
            print(f'⚠️ خطا در ذخیره QC: {e}')
        
        return Response({
            'decision': decision,
            'can_proceed': can_proceed,
            'completeness_score': completeness,
            'passed_count': len(passed),
            'issues_count': blocking_count,
            'warnings_count': len(warnings),
            'passed': passed,
            'issues': issues,
            'warnings': warnings,
        })
