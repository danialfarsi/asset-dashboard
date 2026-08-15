from django.db import models
from django.conf import settings
from ..models import ScreenedAsset

class GraphDimensionBase(models.Model):
    """کلاس پایه برای ابعاد گراف دانش"""
    asset = models.ForeignKey(ScreenedAsset, on_delete=models.CASCADE, related_name='%(class)s_dimensions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class AssetOntology(GraphDimensionBase):
    """بُعد ۱: هستی‌شناسی دارایی"""
    asset_type = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    sub_category = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Ontology: {self.asset_type} - {self.category}"

class StrategicDimension(GraphDimensionBase):
    """بُعد ۲: راهبردی"""
    goal = models.CharField(max_length=255, blank=True)
    strategic_priority = models.CharField(max_length=100, blank=True)
    alignment_score = models.FloatField(default=0, help_text='امتیاز هم‌راستایی با استراتژی')
    
    def __str__(self):
        return f"Strategic: {self.goal[:50]}..."

class EconomicDimension(GraphDimensionBase):
    """بُعد ۳: ارزشی و اقتصادی"""
    valuation_method = models.CharField(max_length=50, blank=True)
    revenue_stream = models.TextField(blank=True)
    economic_impact = models.TextField(blank=True)
    value_driver = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Economic: {self.valuation_method}"

class LegalDimension(GraphDimensionBase):
    """بُعد ۴: حقوقی و IP"""
    patent_status = models.CharField(max_length=50, blank=True)
    license_type = models.CharField(max_length=50, blank=True)
    jurisdiction = models.CharField(max_length=100, blank=True)
    nda_status = models.BooleanField(default=False)
    protection_level = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"Legal: {self.patent_status}"

class SecurityDimension(GraphDimensionBase):
    """بُعد ۵: امنیتی"""
    security_level = models.CharField(max_length=50, blank=True)
    access_control_policy = models.TextField(blank=True)
    data_classification = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"Security: {self.security_level}"

class OrganizationalDimension(GraphDimensionBase):
    """بُعد ۶: سازمانی"""
    owner = models.CharField(max_length=255, blank=True)
    team = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=255, blank=True)
    responsible_person = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return f"Organizational: {self.owner}"

class EcosystemDimension(GraphDimensionBase):
    """بُعد ۷: اکوسیستم"""
    stakeholders = models.JSONField(default=list, blank=True)
    partners = models.JSONField(default=list, blank=True)
    markets = models.JSONField(default=list, blank=True)
    ecosystem_impact = models.TextField(blank=True)
    
    def __str__(self):
        return f"Ecosystem: {len(self.stakeholders)} stakeholders"

class EvolutionaryDimension(GraphDimensionBase):
    """بُعد ۸: تکاملی"""
    milestones = models.JSONField(default=list, blank=True)
    provenance_records = models.JSONField(default=list, blank=True)
    version_history = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"Evolutionary: {len(self.milestones)} milestones"

class RiskOpportunityDimension(GraphDimensionBase):
    """بُعد ۹: ریسک و فرصت"""
    risk_indicators = models.JSONField(default=list, blank=True)
    opportunities = models.JSONField(default=list, blank=True)
    risk_score = models.FloatField(default=0)
    opportunity_score = models.FloatField(default=0)
    
    def __str__(self):
        return f"Risk: {self.risk_score}, Opportunity: {self.opportunity_score}"
