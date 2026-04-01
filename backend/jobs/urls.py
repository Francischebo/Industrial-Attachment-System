from django.urls import path
from .views import (
    JobListCreateView, JobDetailView,
    ApplicationListCreateView, ApplicationDetailView,
    AnalyticsView
)

urlpatterns = [
    path('jobs/', JobListCreateView.as_view(), name='job-list'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('applications/', ApplicationListCreateView.as_view(), name='application-list'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
