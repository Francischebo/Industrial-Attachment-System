import re
from rest_framework import generics, permissions, serializers
from django.db.models import Count, Avg
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek, TruncYear

User = get_user_model()


class IsManagementOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method == "DELETE" and request.user.role == "HR":
            return False
        return request.user.role in ["ADMIN", "HR"]


class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer
    permission_classes = (IsManagementOrReadOnly,)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = (IsManagementOrReadOnly,)


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Application.objects.select_related(
            "job", "user", "user__profile"
        ).prefetch_related("user__documents").order_by("-applied_at")
        if self.request.user.role in ["ADMIN", "HR"]:
            return qs.all()
        return qs.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = (
            User.objects.select_related("profile")
            .prefetch_related("education", "experience", "documents")
            .get(id=self.request.user.id)
        )
        job = serializer.validated_data["job"]

        # Cross-Validation Step
        reqs = [
            "COVER_LETTER",
            "INSTITUTION_INTRO",
            "RESUME",
            "TRANSCRIPT",
            "GOOD_CONDUCT",
            "STUDENT_INSURANCE",
            "STUDENT_ID",
            "NATIONAL_ID",
            "NEXT_OF_KIN_ID",
        ]

        uploaded_docs = {doc.document_type for doc in user.documents.all()}
        missing_docs = [r for r in reqs if r not in uploaded_docs]

        if missing_docs:
            raise serializers.ValidationError(
                {
                    "detail": f"Application refused. You are missing required documents: {', '.join([d.replace('_', ' ') for d in missing_docs])}"
                }
            )

        # NLP ATS processing
        applicant_text_parts = []

        for edu in user.education.all():
            applicant_text_parts.append(
                f"{edu.qualification} {edu.field_of_study} {edu.institution}"
            )

        for exp in user.experience.all():
            applicant_text_parts.append(
                f"{exp.job_title} {exp.responsibilities} {exp.organization}"
            )

        try:
            applicant_text_parts.append(f"{user.profile.county_of_residence}")
        except Exception:
            pass

        applicant_text = " ".join(applicant_text_parts).lower()
        job_req_text = job.requirements.lower()

        def get_words(text):
            return set(re.findall(r"\b\w+\b", text))

        applicant_words = get_words(applicant_text)
        job_words = get_words(job_req_text)

        if not applicant_words:
            raise serializers.ValidationError(
                {
                    "detail": "Profile is empty. Please complete your Experience and Education before applying."
                }
            )

        if not job_words:
            ats_score = 100.0
        else:
            intersection = applicant_words.intersection(job_words)
            match_ratio = len(intersection) / len(job_words)
            ats_score = round(match_ratio * 100, 2)

            if ats_score < 20.0:
                raise serializers.ValidationError(
                    {
                        "detail": f"Application rejected. Your profile matches only {ats_score}% of the job requirements. A minimum of 20% overlap is required."
                    }
                )

        serializer.save(user=user, ats_score=ats_score)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Application.objects.select_related(
            "job", "user", "user__profile"
        ).prefetch_related("user__documents").order_by("-applied_at")
        if self.request.user.role in ["ADMIN", "HR"]:
            return qs.all()
        return qs.filter(user=self.request.user)


class ApplicationStatusUpdateView(APIView):
    permission_classes = (IsManagementOrReadOnly,)

    def patch(self, request, pk):
        try:
            instance = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status in dict(Application.STATUS_CHOICES).keys():
            instance.status = new_status
            instance.save(update_fields=["status"])
            return Response(
                {
                    "detail": f"Application marked as {new_status}.",
                    "status": instance.status,
                }
            )
        return Response(
            {"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST
        )


class AnalyticsView(APIView):
    permission_classes = (IsManagementOrReadOnly,)

    def get(self, request):
        now = timezone.now()
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        if start_date_str and end_date_str:
            from datetime import datetime
            try:
                parsed_start = datetime.strptime(start_date_str, "%Y-%m-%d")
                parsed_end = datetime.strptime(end_date_str, "%Y-%m-%d") + timedelta(days=1, seconds=-1)
                start_date = timezone.make_aware(parsed_start) if timezone.is_naive(parsed_start) else parsed_start
                end_date = timezone.make_aware(parsed_end) if timezone.is_naive(parsed_end) else parsed_end
            except ValueError:
                start_date = now - timedelta(days=30)
                end_date = now
        else:
            start_date = now - timedelta(days=30)
            end_date = now

        delta_days = (end_date - start_date).days

        if delta_days <= 45:
            trunc_func = TruncDate("applied_at")
            date_format = "%b %d"
            period_label = "Daily"
        elif delta_days <= 180:
            trunc_func = TruncWeek("applied_at")
            date_format = "%b %d"
            period_label = "Weekly"
        elif delta_days <= 730:
            trunc_func = TruncMonth("applied_at")
            date_format = "%b %Y"
            period_label = "Monthly"
        else:
            trunc_func = TruncYear("applied_at")
            date_format = "%Y"
            period_label = "Yearly"

        apps = Application.objects.filter(applied_at__gte=start_date, applied_at__lte=end_date)
        jobs_qs = Job.objects.filter(created_at__gte=start_date, created_at__lte=end_date)

        total_jobs = jobs_qs.count()
        total_applications = apps.count()

        status_distribution = list(apps.values("status").annotate(count=Count("id")))
        # Show job category demands based on applications received for each job type in period
        job_type_distribution = list(
            apps.values("job__job_type").annotate(count=Count("id"))
        )

        # fix job_type key name to match old response
        formatted_job_type_dict = []
        for j in job_type_distribution:
            formatted_job_type_dict.append(
                {"job_type": j["job__job_type"], "count": j["count"]}
            )

        avg_ats_score = apps.aggregate(Avg("ats_score"))["ats_score__avg"] or 0

        trend_qs = (
            apps.annotate(period_date=trunc_func)
            .values("period_date")
            .annotate(app_count=Count("id"), avg_score=Avg("ats_score"))
            .order_by("period_date")
        )

        trend = []
        for item in trend_qs:
            trend.append(
                {
                    "date": (
                        item["period_date"].strftime(date_format)
                        if hasattr(item["period_date"], "strftime")
                        else str(item["period_date"])
                    ),
                    "applications": item["app_count"],
                    "average_score": (
                        round(item["avg_score"], 2) if item["avg_score"] else 0
                    ),
                }
            )

        return Response(
            {
                "total_jobs": total_jobs,
                "total_applications": total_applications,
                "status_distribution": status_distribution,
                "job_type_distribution": formatted_job_type_dict,
                "average_ats_score": round(avg_ats_score, 2),
                "trend": trend,
                "period_label": period_label,
            }
        )
