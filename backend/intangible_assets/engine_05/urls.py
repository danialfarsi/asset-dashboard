from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DevelopmentOpportunityViewSet,
    InnovationIdeaViewSet,
    PrioritizedProjectViewSet,
    ProjectCharterViewSet,
    GanttScheduleViewSet,
    AllocatedBudgetViewSet,
    ProgressReportViewSet,
    DevelopedOrNewAssetViewSet,
    ProjectClosureReportViewSet,
)

router = DefaultRouter()

# گام ۱
router.register(r'opportunities', DevelopmentOpportunityViewSet, basename='development-opportunity')
router.register(r'ideas', InnovationIdeaViewSet, basename='innovation-idea')

# گام ۲
router.register(r'projects', PrioritizedProjectViewSet, basename='prioritized-project')

# گام ۳
router.register(r'charters', ProjectCharterViewSet, basename='project-charter')
router.register(r'gantt', GanttScheduleViewSet, basename='gantt-schedule')
router.register(r'budgets', AllocatedBudgetViewSet, basename='allocated-budget')

# گام ۴
router.register(r'progress', ProgressReportViewSet, basename='progress-report')

# گام ۵
router.register(r'developed-assets', DevelopedOrNewAssetViewSet, basename='developed-asset')
router.register(r'closures', ProjectClosureReportViewSet, basename='project-closure')

urlpatterns = [
    path('', include(router.urls)),
]
