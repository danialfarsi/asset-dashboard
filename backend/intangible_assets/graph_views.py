from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from intangible_assets.models import ScreenedAsset
from intangible_assets.valuation_models import ValuationCase
from intangible_assets.valuation_step4_models import ValuationStep4

class GraphViewSet(viewsets.ViewSet):
    """API ساده گراف دانش - بدون وابستگی به ابعاد"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def get_graph(self, request, pk=None):
        """دریافت گراف ساده یک دارایی"""
        try:
            asset_id = int(pk)
            
            try:
                main_asset = ScreenedAsset.objects.get(id=asset_id)
            except ScreenedAsset.DoesNotExist:
                return Response(
                    {'error': 'دارایی یافت نشد'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            nodes = []
            edges = []
            node_ids = set()
            
            # ۱. گره اصلی
            main_node = {
                'id': f'asset_{main_asset.id}',
                'label': main_asset.asset_name,
                'type': 'IntangibleAsset',
                'group': 'assets',
                'is_main': True,
                'value': 0,
                'category': main_asset.category or 'unknown'
            }
            
            # دریافت ارزش
            valuation_case = None
            try:
                valuation_case = ValuationCase.objects.filter(asset_id=asset_id).first()
                if valuation_case:
                    step4 = ValuationStep4.objects.filter(valuation_case_id=valuation_case.id).first()
                    if step4 and step4.final_value:
                        main_node['value'] = float(step4.final_value)
            except:
                pass
            
            nodes.append(main_node)
            node_ids.add(f'asset_{main_asset.id}')
            
            # ۲. دریافت دارایی‌های مرتبط (Linked Assets)
            try:
                if valuation_case:
                    linked_assets = valuation_case.linked_assets.all()
                    for linked in linked_assets[:10]:
                        node_id = f'asset_{linked.id}'
                        if node_id not in node_ids:
                            linked_node = {
                                'id': node_id,
                                'label': linked.asset_name,
                                'type': 'LinkedAsset',
                                'group': 'assets',
                                'is_main': False,
                                'value': 0,
                                'category': linked.category or 'unknown'
                            }
                            # دریافت ارزش دارایی مرتبط
                            try:
                                linked_valuation = ValuationCase.objects.filter(asset_id=linked.id).first()
                                if linked_valuation:
                                    linked_step4 = ValuationStep4.objects.filter(valuation_case_id=linked_valuation.id).first()
                                    if linked_step4 and linked_step4.final_value:
                                        linked_node['value'] = float(linked_step4.final_value)
                            except:
                                pass
                            
                            nodes.append(linked_node)
                            node_ids.add(node_id)
                            edges.append({
                                'from': f'asset_{main_asset.id}',
                                'to': node_id,
                                'type': 'RELATED_TO',
                                'label': 'مرتبط با'
                            })
            except Exception as e:
                print(f'Error getting linked assets: {e}')
            
            # ۳. دریافت دارایی‌های مشابه (با organization_name)
            try:
                if main_asset.organization_name:
                    similar_assets = ScreenedAsset.objects.filter(
                        organization_name=main_asset.organization_name
                    ).exclude(id=asset_id)[:5]
                    for similar in similar_assets:
                        node_id = f'asset_{similar.id}'
                        if node_id not in node_ids:
                            similar_node = {
                                'id': node_id,
                                'label': similar.asset_name,
                                'type': 'SimilarAsset',
                                'group': 'assets',
                                'is_main': False,
                                'value': 0,
                                'category': similar.category or 'unknown'
                            }
                            # دریافت ارزش دارایی مشابه
                            try:
                                similar_valuation = ValuationCase.objects.filter(asset_id=similar.id).first()
                                if similar_valuation:
                                    similar_step4 = ValuationStep4.objects.filter(valuation_case_id=similar_valuation.id).first()
                                    if similar_step4 and similar_step4.final_value:
                                        similar_node['value'] = float(similar_step4.final_value)
                            except:
                                pass
                            
                            nodes.append(similar_node)
                            node_ids.add(node_id)
                            edges.append({
                                'from': f'asset_{main_asset.id}',
                                'to': node_id,
                                'type': 'SIMILAR_TO',
                                'label': 'مشابه'
                            })
            except Exception as e:
                print(f'Error getting similar assets: {e}')
            
            # ۴. محاسبه آمار
            total_value = sum(n.get('value', 0) for n in nodes)
            
            return Response({
                'nodes': nodes,
                'edges': edges,
                'stats': {
                    'total_nodes': len(nodes),
                    'total_edges': len(edges),
                    'total_value': total_value,
                    'main_asset': {
                        'id': main_asset.id,
                        'name': main_asset.asset_name,
                        'uid': main_asset.asset_uid
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
