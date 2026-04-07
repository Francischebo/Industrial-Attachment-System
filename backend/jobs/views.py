import re
from rest_framework import generics, permissions, serializers
from django.db.models import Count, Avg
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer
from accounts.models import Profile, Education, Experience
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = (IsAdminOrReadOnly,)

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = (IsAdminOrReadOnly,)

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Application.objects.all()
        return Application.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        user = self.request.user
        job = serializer.validated_data['job']
        
        # Cross-Validation Step
        opp_type = getattr(user.profile, 'opportunity_type', 'NONE')
        if opp_type == 'NONE':
            raise serializers.ValidationError({"detail": "Please configure your Profile Dashboard for Attachment or Internship before applying."})
            
        if opp_type != job.job_type:
            raise serializers.ValidationError({"detail": f"Your profile is configured for {opp_type.lower()}s, but this is an {job.job_type.lower()} opening."})

        if opp_type == 'INTERNSHIP':
            reqs = ['NATIONAL_ID', 'KRA_PIN', 'SHA_CARD', 'NSSF_CARD', 'BIRTH_CERT', 'ACADEMIC_CERT', 'SECRETS_ACT_FORM', 'PSIP_FORM', 'PASSPORT_PHOTOS', 'ATM_CARD']
        else:
            reqs = ['COVER_LETTER', 'INSTITUTION_INTRO', 'RESUME', 'TRANSCRIPT', 'GOOD_CONDUCT', 'STUDENT_INSURANCE', 'STUDENT_ID', 'NATIONAL_ID', 'NEXT_OF_KIN_ID']
             
        uploaded_docs = set(user.documents.values_list('document_type', flat=True))
        missing_docs = [r for r in reqs if r not in uploaded_docs]
        
        if missing_docs:
            raise serializers.ValidationError({"detail": f"Application refused. You are missing required documents: {', '.join([d.replace('_', ' ') for d in missing_docs])}"})
        
        # NLP ATS processing
        applicant_text_parts = []
        
        for edu in user.education.all():
            applicant_text_parts.append(f"{edu.qualification} {edu.field_of_study} {edu.institution}")
        
        for exp in user.experience.all():
            applicant_text_parts.append(f"{exp.job_title} {exp.responsibilities} {exp.organization}")
            
        try:
            applicant_text_parts.append(f"{user.profile.county_of_residence}")
        except:
            pass
            
        applicant_text = " ".join(applicant_text_parts).lower()
        job_req_text = job.requirements.lower()
        
        def get_words(text):
            return set(re.findall(r'\b\w+\b', text))
            
        applicant_words = get_words(applicant_text)
        job_words = get_words(job_req_text)
        
        if not applicant_words:
            raise serializers.ValidationError({"detail": "Profile is empty. Please complete your Experience and Education before applying."})
            
        if not job_words:
            ats_score = 100.0
        else:
            intersection = applicant_words.intersection(job_words)
            union = applicant_words.union(job_words)
            jaccard_similarity = len(intersection) / len(union) if union else 0
            ats_score = round(jaccard_similarity * 100, 2)
            
            if ats_score < 20.0:
                raise serializers.ValidationError({"detail": f"Application rejected. Your profile matches only {ats_score}% of the job requirements. A minimum of 20% overlap is required."})
                
        serializer.save(user=user, ats_score=ats_score)

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Application.objects.all()
        return Application.objects.filter(user=self.request.user)

from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek, TruncYear

class AnalyticsView(APIView):
    permission_classes = (IsAdminOrReadOnly,)
    
    def get(self, request):
        period = request.query_params.get('period', 'monthly').lower()
        now = timezone.now()
        
        if period == 'daily':
            start_date = now - timedelta(days=7)
            trunc_func = TruncDate('applied_at')
            date_format = "%b %d"
        elif period == 'weekly':
            start_date = now - timedelta(weeks=4)
            trunc_func = TruncWeek('applied_at')
            date_format = "%b %d"
        elif period == 'yearly':
            start_date = now - timedelta(days=365 * 5)
            trunc_func = TruncYear('applied_at')
            date_format = "%Y"
        else: # monthly
            start_date = now - timedelta(days=365)
            trunc_func = TruncMonth('applied_at')
            date_format = "%b %Y"
            
        apps = Application.objects.filter(applied_at__gte=start_date)
        jobs_qs = Job.objects.filter(created_at__gte=start_date)
        
        total_jobs = jobs_qs.count()
        total_applications = apps.count()
        
        status_distribution = list(apps.values('status').annotate(count=Count('id')))
        # Show job category demands based on applications received for each job type in period
        job_type_distribution = list(apps.values('job__job_type').annotate(count=Count('id')))
        
        # fix job_type key name to match old response
        formatted_job_type_dict = []
        for j in job_type_distribution:
            formatted_job_type_dict.append({
                'job_type': j['job__job_type'],
                'count': j['count']
            })
            
        avg_ats_score = apps.aggregate(Avg('ats_score'))['ats_score__avg'] or 0
        
        trend_qs = apps.annotate(period_date=trunc_func).values('period_date').annotate(
            app_count=Count('id'),
            avg_score=Avg('ats_score')
        ).order_by('period_date')
        
        trend = []
        for item in trend_qs:
            trend.append({
                'date': item['period_date'].strftime(date_format) if hasattr(item['period_date'], 'strftime') else str(item['period_date']),
                'applications': item['app_count'],
                'average_score': round(item['avg_score'], 2) if item['avg_score'] else 0
            })
            
        return Response({
            "total_jobs": total_jobs,
            "total_applications": total_applications,
            "status_distribution": status_distribution,
            "job_type_distribution": formatted_job_type_dict,
            "average_ats_score": round(avg_ats_score, 2),
            "trend": trend,
            "period": period,
        })
