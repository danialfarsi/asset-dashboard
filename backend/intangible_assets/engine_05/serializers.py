from rest_framework import serializers
from .models import (
    DevelopmentOpportunity,
    InnovationIdea,
    PrioritizedProject,
    ProjectCharter,
    GanttSchedule,
    AllocatedBudget,
    ProgressReport,
    DevelopedOrNewAsset,
    ProjectClosureReport,
)


class DevelopmentOpportunitySerializer(serializers.ModelSerializer):
    """Serializer فرصت توسعه"""
    
    gap_type_display = serializers.CharField(source='get_gap_type_display', read_only=True)
    target_module_display = serializers.CharField(source='get_target_module_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DevelopmentOpportunity
        fields = [
            'id',
            'asset', 'asset_name',
            'organization', 'organization_name',
            'gap_type', 'gap_type_display',
            'current_s', 'current_t', 'current_o', 'current_m', 'current_r',
            'target_s', 'target_t', 'target_o', 'target_m', 'target_r',
            'gap_score', 'is_critical',
            'potential_value',
            'target_module', 'target_module_display',
            'status', 'status_display',
            'description', 'recommendation',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'gap_score', 'created_at', 'updated_at', 'created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.username
        return None


class InnovationIdeaSerializer(serializers.ModelSerializer):
    """Serializer ایده نوآوری"""
    
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    tech_domain_display = serializers.CharField(source='get_tech_domain_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InnovationIdea
        fields = [
            'id',
            'title', 'concept_desc',
            'source', 'source_display',
            'tech_domain', 'tech_domain_display',
            'strategic_alignment',
            'organization', 'organization_name',
            'target_module',
            'status', 'status_display',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'target_module', 'created_at', 'updated_at', 'created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۲: PrioritizedProject
# ═══════════════════════════════════════════════════════════

class PrioritizedProjectSerializer(serializers.ModelSerializer):
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PrioritizedProject
        fields = [
            'id', 'title', 'project_type', 'project_type_display',
            'opportunity', 'innovation_idea',
            'c1_strategic', 'c2_roi', 'c3_feasibility', 'c4_goal_alignment', 'c5_urgency',
            'priority_score', 'rank',
            'estimated_budget', 'approved_budget',
            'approval_status', 'approval_status_display',
            'organization', 'organization_name',
            'committee_comment',
            'approved_by', 'approved_by_name', 'approved_at',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'priority_score', 'rank', 'created_at', 'updated_at', 'approved_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۳: ProjectCharter
# ═══════════════════════════════════════════════════════════

class ProjectCharterSerializer(serializers.ModelSerializer):
    methodology_display = serializers.CharField(source='get_methodology_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectCharter
        fields = [
            'id', 'project', 'project_title',
            'scope', 'business_case', 'target_kpis',
            'methodology', 'methodology_display',
            'team_assigned', 'risks',
            'status', 'status_display',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۳: GanttSchedule
# ═══════════════════════════════════════════════════════════

class GanttScheduleSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GanttSchedule
        fields = [
            'id', 'project', 'project_title',
            'start_date', 'end_date',
            'milestones', 'wbs', 'physical_progress',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۳: AllocatedBudget
# ═══════════════════════════════════════════════════════════

class AllocatedBudgetSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = AllocatedBudget
        fields = [
            'id', 'project', 'project_title',
            'capex', 'opex', 'contingency_reserve', 'total_amount',
            'consumed_amount', 'remaining_amount',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_amount', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_remaining_amount(self, obj):
        return float(obj.total_amount) - float(obj.consumed_amount)


# ═══════════════════════════════════════════════════════════
# گام ۴: ProgressReport
# ═══════════════════════════════════════════════════════════

class ProgressReportSerializer(serializers.ModelSerializer):
    gate_decision_display = serializers.CharField(source='get_gate_decision_display', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    reported_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProgressReport
        fields = [
            'id', 'project', 'project_title',
            'report_number', 'report_date',
            'physical_progress_pct', 'budget_consumed_pct',
            'spi', 'cpi',
            'active_risks',
            'gate_decision', 'gate_decision_display', 'gate_notes',
            'notes',
            'reported_by', 'reported_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'report_date', 'created_at']
    
    def get_reported_by_name(self, obj):
        if obj.reported_by:
            return f"{obj.reported_by.first_name} {obj.reported_by.last_name}".strip() or obj.reported_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۵: DevelopedOrNewAsset
# ═══════════════════════════════════════════════════════════

class DevelopedOrNewAssetSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    source_asset_name = serializers.CharField(source='source_asset.asset_name', read_only=True, allow_null=True)
    new_asset_name = serializers.CharField(source='new_asset.asset_name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DevelopedOrNewAsset
        fields = [
            'id', 'project', 'project_title',
            'is_new',
            'source_asset', 'source_asset_name',
            'new_asset', 'new_asset_name',
            'tech_docs_url', 'source_code_or_design', 'version',
            'attachments',
            'registered_in_engine_1', 'protected_in_engine_3', 'valued_in_engine_2',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


# ═══════════════════════════════════════════════════════════
# گام ۵: ProjectClosureReport
# ═══════════════════════════════════════════════════════════

class ProjectClosureReportSerializer(serializers.ModelSerializer):
    signoff_status_display = serializers.CharField(source='get_signoff_status_display', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectClosureReport
        fields = [
            'id', 'project', 'project_title',
            'final_kpi_score', 'variance_summary', 'realized_roi',
            'lessons_learned',
            'signoff_status', 'signoff_status_display',
            'signoffs', 'report_file',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
