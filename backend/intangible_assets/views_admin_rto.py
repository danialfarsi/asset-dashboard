"""
API ادمین برای دیدن لیست دانشجویان RTO + فایل‌های آپلودیشون
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .rto_models import RTOStudentInfo
from .valuation_models import ValuationAnswer


class AdminRTOStudentsListView(APIView):
    """
    GET: لیست کامل دانشجویان + پاسخ‌ها + فایل‌ها
    فقط برای ادمین
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # بررسی دسترسی ادمین
        if not (hasattr(request.user, 'role') and request.user.role in ['super_admin', 'org_admin']):
            return Response({'error': 'دسترسی ندارید'}, status=403)

        students = RTOStudentInfo.objects.select_related('asset').order_by('-created_at')

        results = []
        for student in students:
            asset = student.asset

            # گرفتن پاسخ‌های ارزیابی
            answers = []
            final_score = 0
            try:
                from .valuation_models import AssetValuation
                valuation = AssetValuation.objects.filter(asset=asset, status='completed').first()
                if valuation:
                    final_score = float(valuation.final_score or 0)
                    for ans in valuation.answers.select_related('question').all():
                        # چک فایل شاهد
                        has_file = bool(ans.evidence_document)
                        file_url = ans.evidence_document.url if has_file else None

                        answers.append({
                            'id': ans.id,
                            'question_text': ans.question.question_text if ans.question else '',
                            'dimension': ans.question.dimension.name if ans.question and ans.question.dimension else '',
                            'score': ans.score,
                            'evidence': ans.evidence or '',
                            'has_file': has_file,
                            'file_url': file_url,
                            'file_name': ans.evidence_document.name.split('/')[-1] if has_file else None,
                        })
            except Exception as e:
                print(f"Error loading valuation for asset {asset.id}: {e}")

            results.append({
                'id': student.id,
                'asset_id': asset.id,
                'asset_name': asset.asset_name,
                'asset_type': asset.asset_type.name if asset.asset_type else None,
                'student_name': student.student_name,
                'student_family': student.student_family,
                'student_full_name': f"{student.student_name} {student.student_family}",
                'student_id': student.student_id,
                'student_phone': student.student_phone,
                'student_email': student.student_email,
                'created_at': student.created_at,
                'final_score': final_score,
                'answers': answers,
                'total_answers': len(answers),
                'total_files': sum(1 for a in answers if a['has_file']),
            })

        return Response({
            'count': len(results),
            'results': results,
        })
