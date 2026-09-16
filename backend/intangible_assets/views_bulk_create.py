from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import ScreenedAsset, ScreeningTemplate
from .asset_codes import generate_asset_uid


class BulkCreateScreenedAssetsView(APIView):
    """
    POST /api/intangible/screening/bulk-create/
    Body: {
      "assets": [
        {
          "asset_name": "...",
          "category": "...",
          "result": "...",
          "template_id": 1,
          "asset_type_id": 2,
          "valuation_method": "M-03",
          "valuation_type": "DCF",
          "description": "..."
        },
        ...
      ]
    }
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        assets_data = request.data.get('assets', [])
        
        if not isinstance(assets_data, list):
            return Response({'error': 'assets باید لیست باشد'}, status=400)
        
        if not assets_data:
            return Response({'error': 'حداقل یک دارایی لازم است'}, status=400)
        
        created = []
        errors = []
        
        for idx, item in enumerate(assets_data):
            try:
                asset_name = item.get('asset_name', '').strip()
                if not asset_name:
                    errors.append({'index': idx, 'error': 'نام دارایی الزامی است'})
                    continue
                
                category = item.get('category', 'unknown')
                result = item.get('result', 'confirmed')
                description = item.get('description', '')
                template_id = item.get('template_id')
                asset_type_id = item.get('asset_type_id')
                valuation_method = item.get('valuation_method')
                valuation_type = item.get('valuation_type')
                
                # اگه asset_type_id نیومده، از template بگیر
                if not asset_type_id and template_id:
                    try:
                        tmpl = ScreeningTemplate.objects.get(id=template_id)
                        asset_type_id = tmpl.asset_type_id
                        if not valuation_method:
                            valuation_method = tmpl.valuation_method
                    except ScreeningTemplate.DoesNotExist:
                        pass
                
                # ساخت asset
                asset_uid = generate_asset_uid(category, asset_name)
                
                # سازمان و واحد
                organization = None
                department = None
                
                if user.role == 'super_admin':
                    department_id = item.get('department_id')
                    if department_id:
                        from accounts.models import Department
                        department = Department.objects.filter(id=department_id).first()
                        if department:
                            organization = department.organization
                elif user.role == 'org_admin':
                    organization = user.organization
                elif user.role == 'org_user':
                    organization = user.organization
                    department = user.department
                
                # ساخت asset
                asset = ScreenedAsset.objects.create(
                    asset_name=asset_name,
                    asset_uid=asset_uid,
                    category=category,
                    result=result,
                    description=description,
                    asset_type_id=asset_type_id,
                    valuation_method=valuation_method,
                    valuation_type=valuation_type,
                    created_by=user,
                    organization=organization,
                    department=department,
                )
                
                created.append({
                    'id': asset.id,
                    'asset_name': asset.asset_name,
                    'asset_uid': asset.asset_uid,
                })
                
            except Exception as e:
                errors.append({'index': idx, 'error': str(e)})
                print(f"Error creating asset {idx}: {e}")
        
        return Response({
            'created_count': len(created),
            'error_count': len(errors),
            'created': created,
            'errors': errors,
        })
