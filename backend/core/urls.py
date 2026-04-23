from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "status": "success",
        "message": "Industrial Attachment System API is running smoothly."
    })

urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/jobs/", include("jobs.urls")),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
