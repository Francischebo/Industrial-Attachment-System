from django.contrib import admin
from django.urls import path, include

from django.http import JsonResponse
from django.core.management import call_command
from io import StringIO

def force_migrate(request):
    out = StringIO()
    try:
        call_command('migrate', stdout=out)
        return JsonResponse({"status": "success", "output": out.getvalue()})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})

def api_root(request):
    return JsonResponse({
        "status": "success",
        "message": "Industrial Attachment System API is running smoothly."
    })

urlpatterns = [
    path("", api_root),
    path("force-migrate/", force_migrate),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/jobs/", include("jobs.urls")),
]
