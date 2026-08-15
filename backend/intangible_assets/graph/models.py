from neo4j import GraphDatabase
from django.conf import settings
from datetime import datetime
import uuid

class Neo4jConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
        return cls._instance
    
    def close(self):
        if self.driver:
            self.driver.close()


class GraphAsset:
    """مدل گره دارایی در گراف دانش"""
    
    def __init__(self, asset_id, asset_uid, asset_name, asset_type, category):
        self.asset_id = asset_id
        self.asset_uid = asset_uid
        self.asset_name = asset_name
        self.asset_type = asset_type
        self.category = category
        self.created_at = datetime.now().isoformat()
        self.valid_from = datetime.now().isoformat()
        self.valid_to = None
        self.version_id = str(uuid.uuid4())
        self.value = 0
        self.maturity = 0
        self.risk_score = 0
    
    def to_dict(self):
        return {
            'asset_id': self.asset_id,
            'asset_uid': self.asset_uid,
            'asset_name': self.asset_name,
            'asset_type': self.asset_type,
            'category': self.category,
            'created_at': self.created_at,
            'valid_from': self.valid_from,
            'valid_to': self.valid_to,
            'version_id': self.version_id,
            'value': self.value,
            'maturity': self.maturity,
            'risk_score': self.risk_score
        }


class GraphRelationship:
    """مدل رابطه در گراف دانش"""
    
    RELATION_TYPES = {
        'OWNED_BY': 'مالکیت',
        'PART_OF': 'بخشی از',
        'DEPENDS_ON': 'وابسته به',
        'COMPLEMENTS': 'تکمیل‌کننده',
        'COMPETES_WITH': 'رقابت با',
        'VALUATED_BY': 'ارزش‌گذاری شده توسط',
        'PROTECTED_BY': 'محافظت شده توسط',
        'RELATED_TO': 'مرتبط با',
    }
    
    def __init__(self, from_asset_id, to_asset_id, rel_type, properties=None):
        self.from_asset_id = from_asset_id
        self.to_asset_id = to_asset_id
        self.rel_type = rel_type
        self.properties = properties or {}
        self.created_at = datetime.now().isoformat()


class GraphQuery:
    """کلاس کوئری‌های گراف دانش"""
    
    def __init__(self):
        self.conn = Neo4jConnection()
    
    def create_asset_node(self, asset_data):
        """ایجاد گره دارایی در گراف"""
        with self.conn.driver.session() as session:
            query = """
            CREATE (a:IntangibleAsset {
                asset_id: $asset_id,
                asset_uid: $asset_uid,
                asset_name: $asset_name,
                asset_type: $asset_type,
                category: $category,
                value: $value,
                maturity: $maturity,
                risk_score: $risk_score,
                created_at: $created_at,
                valid_from: $valid_from,
                valid_to: $valid_to,
                version_id: $version_id,
                is_active: true
            })
            RETURN a
            """
            result = session.run(query, **asset_data)
            return result.single()[0]
    
    def create_relationship(self, from_asset_id, to_asset_id, rel_type, properties=None):
        """ایجاد رابطه بین دو گره"""
        with self.conn.driver.session() as session:
            query = """
            MATCH (a:IntangibleAsset {asset_id: $from_asset_id})
            MATCH (b:IntangibleAsset {asset_id: $to_asset_id})
            CREATE (a)-[r:`$rel_type` {
                created_at: $created_at,
                properties: $properties
            }]->(b)
            RETURN r
            """
            result = session.run(
                query,
                from_asset_id=from_asset_id,
                to_asset_id=to_asset_id,
                rel_type=rel_type,
                created_at=datetime.now().isoformat(),
                properties=properties or {}
            )
            return result.single()
    
    def get_asset_graph(self, asset_id, depth=3):
        """دریافت گراف یک دارایی تا عمق مشخص"""
        with self.conn.driver.session() as session:
            query = """
            MATCH path = (a:IntangibleAsset {asset_id: $asset_id})-[r*1..$depth]-(b)
            RETURN path
            """
            result = session.run(query, asset_id=asset_id, depth=depth)
            return list(result)
    
    def get_asset_ecosystem(self, asset_id):
        """دریافت اکوسیستم دارایی (همه روابط مستقیم)"""
        with self.conn.driver.session() as session:
            query = """
            MATCH (a:IntangibleAsset {asset_id: $asset_id})
            OPTIONAL MATCH (a)-[r1]-(related1)
            OPTIONAL MATCH (related1)-[r2]-(related2)
            RETURN a, r1, related1, r2, related2
            LIMIT 100
            """
            result = session.run(query, asset_id=asset_id)
            return list(result)
    
    def get_asset_relationships(self, asset_id):
        """دریافت روابط مستقیم یک دارایی"""
        with self.conn.driver.session() as session:
            query = """
            MATCH (a:IntangibleAsset {asset_id: $asset_id})-[r]-(b)
            RETURN a, r, b
            """
            result = session.run(query, asset_id=asset_id)
            return list(result)
    
    def get_asset_value_path(self, asset_id):
        """دریافت مسیرهای تأثیرگذار بر ارزش دارایی"""
        with self.conn.driver.session() as session:
            query = """
            MATCH path = (a:IntangibleAsset {asset_id: $asset_id})-[r*1..5]-(b)
            WHERE b.value IS NOT NULL
            RETURN path, b.value AS influenced_value
            ORDER BY influenced_value DESC
            LIMIT 20
            """
            result = session.run(query, asset_id=asset_id)
            return list(result)
    
    def calculate_centrality(self, asset_id):
        """محاسبه مرکزیت دارایی در شبکه (Betweenness Centrality)"""
        with self.conn.driver.session() as session:
            # نیاز به نصب پلاگین Graph Data Science (GDS)
            query = """
            CALL gds.betweenness.stream('asset-graph')
            YIELD nodeId, score
            WHERE gds.util.asNode(nodeId).asset_id = $asset_id
            RETURN gds.util.asNode(nodeId).asset_id AS asset_id, score AS centrality
            """
            try:
                result = session.run(query, asset_id=asset_id)
                return result.single()
            except:
                return None
    
    def get_community(self, asset_id):
        """یافتن خوشه هم‌افزایی دارایی"""
        with self.conn.driver.session() as session:
            query = """
            CALL gds.louvain.stream('asset-graph')
            YIELD nodeId, communityId
            WHERE gds.util.asNode(nodeId).asset_id = $asset_id
            RETURN communityId
            """
            try:
                result = session.run(query, asset_id=asset_id)
                return result.single()
            except:
                return None
    
    def close(self):
        self.conn.close()


class GraphDimension:
    """ابعاد ۹گانه گراف دانش"""
    
    DIMENSIONS = {
        'ontology': {
            'label': 'هستی‌شناسی دارایی',
            'nodes': ['AssetType', 'Category']
        },
        'strategic': {
            'label': 'راهبردی',
            'nodes': ['Goal', 'StrategicPriority']
        },
        'economic': {
            'label': 'ارزشی و اقتصادی',
            'nodes': ['ValuationRecord', 'RevenueStream']
        },
        'legal': {
            'label': 'حقوقی و IP',
            'nodes': ['Patent', 'NDA', 'License', 'Jurisdiction']
        },
        'security': {
            'label': 'امنیتی',
            'nodes': ['SecurityLevel', 'AccessControlPolicy']
        },
        'organizational': {
            'label': 'سازمانی',
            'nodes': ['Owner', 'Team', 'Department']
        },
        'ecosystem': {
            'label': 'اکوسیستم',
            'nodes': ['Stakeholder', 'Partner', 'Market']
        },
        'evolutionary': {
            'label': 'تکاملی',
            'nodes': ['TimelineMilestone', 'ProvenanceRecord']
        },
        'risk_opportunity': {
            'label': 'ریسک و فرصت',
            'nodes': ['RiskIndicator', 'Opportunity']
        }
    }
    
    @classmethod
    def create_dimension_node(cls, asset_id, dimension_key, node_label, properties):
        """ایجاد گره بُعد برای یک دارایی"""
        conn = Neo4jConnection()
        dimension = cls.DIMENSIONS.get(dimension_key)
        if not dimension:
            return None
        
        with conn.driver.session() as session:
            query = f"""
            MATCH (a:IntangibleAsset {{asset_id: $asset_id}})
            CREATE (d:{node_label} {{
                dimension: $dimension,
                created_at: $created_at,
                properties: $properties
            }})
            CREATE (a)-[:HAS_{dimension_key.upper()}]->(d)
            RETURN d
            """
            result = session.run(
                query,
                asset_id=asset_id,
                dimension=dimension_key,
                created_at=datetime.now().isoformat(),
                properties=properties
            )
            return result.single()
