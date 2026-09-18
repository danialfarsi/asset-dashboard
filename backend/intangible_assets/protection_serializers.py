from rest_framework import serializers
from .protection_models import (
    ProtectionProfile, ProtectionStep1, ProtectionStep2,
    ProtectionStep3, ProtectionStep4, ProtectionStep5
)


class ProtectionProfileSerializer(serializers.ModelSerializer):
    archetype_display = serializers.CharField(source='get_archetype_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # فیلدهای خواندنی از asset
    asset_id = serializers.IntegerField(source='asset.id', read_only=True)
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True)
    asset_uid = serializers.CharField(source='asset.asset_uid', read_only=True)
    
    # 🆕 فیلدهای computed
    is_completed = serializers.SerializerMethodField()
    is_approved = serializers.SerializerMethodField()
    steps_status = serializers.SerializerMethodField()
    
    class Meta:
        model = ProtectionProfile
        fields = [
            'id', 'asset', 'asset_id', 'asset_name', 'asset_uid',
            'archetype', 'archetype_display', 'status', 'status_display',
            'step1_result', 'step2_result', 'step3_result',
            'step4_result', 'step5_result',
            'protection_score', 'legal_score', 'technical_score',
            'is_completed', 'is_approved', 'steps_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_steps_status(self, obj):
        """وضعیت هر step"""
        COMPLETED_VALUES = ['completed', 'registered', 'submitted', 'done', 'approved']
        
        # Step1
        step1_status = 'pending'
        try:
            if obj.step1 and hasattr(obj.step1, 'analysis_result') and obj.step1.analysis_result:
                step1_status = 'completed'
        except:
            pass
        
        # Step2
        step2_status = 'pending'
        try:
            if obj.step2:
                if hasattr(obj.step2, 'strategy_status'):
                    step2_status = obj.step2.strategy_status or 'pending'
                elif hasattr(obj.step2, 'status'):
                    step2_status = obj.step2.status or 'pending'
                else:
                    step2_status = 'completed'
        except:
            pass
        
        # Step3 (حقوقی)
        step3_status = 'pending'
        try:
            if obj.step3 and obj.step3.legal_status:
                step3_status = 'completed' if obj.step3.legal_status in COMPLETED_VALUES else obj.step3.legal_status
        except:
            pass
        
        # Step4 (فنی)
        step4_status = 'pending'
        try:
            if obj.step4:
                # چک کن فیلد security_status داره یا نه
                if hasattr(obj.step4, 'security_status'):
                    s = obj.step4.security_status
                    step4_status = 'completed' if s in COMPLETED_VALUES else (s or 'pending')
                else:
                    # اگه tool انتخاب شده، completed
                    if obj.step4.selected_technical_tools:
                        step4_status = 'completed'
        except:
            pass
        
        # Step5
        step5_status = 'pending'
        try:
            if obj.step5:
                if hasattr(obj.step5, 'is_approved') and obj.step5.is_approved:
                    step5_status = 'completed'
                elif hasattr(obj.step5, 'status') and obj.step5.status in COMPLETED_VALUES:
                    step5_status = 'completed'
        except:
            pass
        
        return {
            'step1': step1_status,
            'step2': step2_status,
            'step3': step3_status,
            'step4': step4_status,
            'step5': step5_status,
        }
    
    def get_is_completed(self, obj):
        """آیا همه stepها complete شدن؟ (نه فقط step3 و step4)"""
        steps = self.get_steps_status(obj)
        return all(
            steps.get(k) == 'completed'
            for k in ['step1', 'step2', 'step3', 'step4']
        )
    
    def get_is_approved(self, obj):
        """آیا نهایی تأیید شده؟"""
        try:
            if obj.step5:
                if hasattr(obj.step5, 'is_approved'):
                    return bool(obj.step5.is_approved)
                if hasattr(obj.step5, 'status'):
                    return obj.step5.status in ['approved', 'completed']
            return False
        except:
            return False


class ProtectionStep1Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep1
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProtectionStep2Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep2
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProtectionStep3Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep3
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProtectionStep4Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep4
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProtectionStep5Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionStep5
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class FullProtectionSerializer(serializers.Serializer):
    profile = ProtectionProfileSerializer()
    step1 = ProtectionStep1Serializer(allow_null=True)
    step2 = ProtectionStep2Serializer(allow_null=True)
    step3 = ProtectionStep3Serializer(allow_null=True)
    step4 = ProtectionStep4Serializer(allow_null=True)
    step5 = ProtectionStep5Serializer(allow_null=True)
