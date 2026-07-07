from django.apps import AppConfig

class IntangibleAssetsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'intangible_assets'
    
    def ready(self):
        import intangible_assets.signals
