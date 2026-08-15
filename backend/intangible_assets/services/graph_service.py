from ..models import ScreenedAsset
from ..valuation_models import ValuationCase
from ..valuation_step4_models import ValuationStep4
from ..graph.dimension_models import (
    AssetOntology, StrategicDimension, EconomicDimension,
    LegalDimension, SecurityDimension, OrganizationalDimension,
    EcosystemDimension, EvolutionaryDimension, RiskOpportunityDimension
)

class GraphService:
    """سرویس کامل گراف دانش با ابعاد ۹گانه"""
    
    def __init__(self):
        self.dimension_models = {
            'ontology': AssetOntology,
            'strategic': StrategicDimension,
            'economic': EconomicDimension,
            'legal': LegalDimension,
            'security': SecurityDimension,
            'organizational': OrganizationalDimension,
            'ecosystem': EcosystemDimension,
            'evolutionary': EvolutionaryDimension,
            'risk_opportunity': RiskOpportunityDimension,
        }
    
    def get_asset_graph_data(self, asset_id, depth=2):
        """دریافت داده‌های کامل گراف با ابعاد ۹گانه"""
        try:
            asset = ScreenedAsset.objects.get(id=asset_id)
            nodes = []
            edges = []
            node_ids = set()
            
            # ۱. گره اصلی
            main_node = self._create_main_node(asset)
            nodes.append(main_node)
            node_ids.add(asset.id)
            
            # ۲. ابعاد ۹گانه
            for dim_key, model in self.dimension_models.items():
                dim_instance = model.objects.filter(asset_id=asset_id).first()
                if dim_instance:
                    dim_node = self._create_dimension_node(dim_key, dim_instance)
                    nodes.append(dim_node)
                    node_ids.add(dim_node['id'])
                    edges.append({
                        'from': asset.id,
                        'to': dim_node['id'],
                        'type': f'HAS_{dim_key.upper()}',
                        'label': self._get_dimension_label(dim_key)
                    })
            
            # ۳. دارایی‌های مرتبط
            valuation_case = ValuationCase.objects.filter(asset_id=asset_id).first()
            if valuation_case:
                linked_assets = valuation_case.linked_assets.all()
                for linked in linked_assets[:10]:
                    if linked.id not in node_ids:
                        linked_node = self._create_linked_node(linked)
                        nodes.append(linked_node)
                        node_ids.add(linked.id)
                        edges.append({
                            'from': asset.id,
                            'to': linked.id,
                            'type': 'RELATED_TO',
                            'label': 'مرتبط با'
                        })
            
            return {
                'success': True,
                'data': {
                    'nodes': nodes,
                    'edges': edges,
                    'stats': self._calculate_stats(nodes, edges, asset)
                }
            }
            
        except ScreenedAsset.DoesNotExist:
            return {'success': False, 'error': 'Asset not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create_main_node(self, asset):
        """ایجاد گره اصلی دارایی"""
        return {
            'id': asset.id,
            'label': asset.asset_name,
            'type': 'IntangibleAsset',
            'value': self._get_asset_value(asset.id),
            'maturity': 0.7,
            'risk_score': 0.3,
            'is_main': True,
            'category': asset.category,
            'asset_uid': asset.asset_uid
        }
    
    def _create_dimension_node(self, dim_key, instance):
        """ایجاد گره برای هر بُعد"""
        return {
            'id': f"{dim_key}_{instance.id}",
            'label': self._get_dimension_label(dim_key),
            'type': f'Dimension_{dim_key.capitalize()}',
            'dimension': dim_key,
            'is_main': False,
            'value': 0
        }
    
    def _create_linked_node(self, asset):
        """ایجاد گره برای دارایی مرتبط"""
        return {
            'id': asset.id,
            'label': asset.asset_name,
            'type': 'LinkedAsset',
            'value': self._get_asset_value(asset.id),
            'is_main': False
        }
    
    def _get_asset_value(self, asset_id):
        """دریافت ارزش دارایی از STEP 4"""
        try:
            valuation_case = ValuationCase.objects.filter(asset_id=asset_id).first()
            if valuation_case:
                step4 = ValuationStep4.objects.filter(valuation_case_id=valuation_case.id).first()
                if step4 and step4.final_value:
                    return float(step4.final_value)
        except:
            pass
        return 0
    
    def _get_dimension_label(self, key):
        """دریافت برچسب فارسی ابعاد"""
        labels = {
            'ontology': 'هستی‌شناسی',
            'strategic': 'راهبردی',
            'economic': 'ارزشی و اقتصادی',
            'legal': 'حقوقی و IP',
            'security': 'امنیتی',
            'organizational': 'سازمانی',
            'ecosystem': 'اکوسیستم',
            'evolutionary': 'تکاملی',
            'risk_opportunity': 'ریسک و فرصت'
        }
        return labels.get(key, key)
    
    def _calculate_stats(self, nodes, edges, asset):
        """محاسبه آمار گراف"""
        total_value = sum(n.get('value', 0) for n in nodes)
        dimension_count = len([n for n in nodes if n.get('dimension')])
        
        return {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'total_value': total_value,
            'dimension_count': dimension_count,
            'main_asset': {
                'id': asset.id,
                'name': asset.asset_name,
                'uid': asset.asset_uid
            }
        }
