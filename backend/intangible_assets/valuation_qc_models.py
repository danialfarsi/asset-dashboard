from django.db import models
from django.conf import settings
from .valuation_models import ValuationCase

class QualityControlResult(models.Model):
    valuation_case = models.OneToOneField(ValuationCase, on_delete=models.CASCADE, related_name='qc_result')
    method_id = models.CharField(max_length=10)
    completeness_score = models.IntegerField()
    total_rules = models.IntegerField()
    passed = models.IntegerField()
    warnings = models.IntegerField()
    errors = models.IntegerField()
    blocking_issues = models.IntegerField()
    decision = models.CharField(max_length=20, choices=[
        ('APPROVE', 'تأیید'),
        ('CONDITIONAL', 'مشروط'),
        ('RETURN', 'بازگشت'),
    ], null=True, blank=True)
    reviewer_comment = models.TextField(blank=True)
    qc_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"QC Result - Case {self.valuation_case.id}"
