from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Profile, Education, Experience, Training, ProfessionalMembership, Document
from .serializers import (
    UserSerializer, RegisterSerializer, ProfileSerializer, 
    EducationSerializer, ExperienceSerializer, TrainingSerializer, 
    ProfessionalMembershipSerializer, DocumentSerializer, UserManagementSerializer,
    CustomTokenObtainPairSerializer
)
from jobs.models import Application

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'ADMIN'

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class ProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        obj, created = Profile.objects.get_or_create(user=self.request.user)
        return obj

class EducationListCreateView(generics.ListCreateAPIView):
    serializer_class = EducationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EducationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EducationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

class ExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

class TrainingListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Training.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TrainingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainingSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Training.objects.filter(user=self.request.user)

class MembershipListCreateView(generics.ListCreateAPIView):
    serializer_class = ProfessionalMembershipSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return ProfessionalMembership.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfessionalMembershipSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return ProfessionalMembership.objects.filter(user=self.request.user)

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

class ProtectedMediaView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk, format=None):
        document = get_object_or_404(Document, pk=pk)
        
        # Check if the user is the owner or an admin
        if document.user != request.user and request.user.role != 'ADMIN':
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to view this file.")
            
        if not document.file:
            raise Http404("File not found")
            
        return FileResponse(document.file.open('rb'), content_type='application/pdf')

class UserManagementListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserManagementSerializer
    permission_classes = (IsAdminRole,)

class UserManagementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = (IsAdminRole,)

class DashboardStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        apps = Application.objects.filter(user=user).order_by('-applied_at')
        applications_count = apps.count()
        
        latest_action = "None"
        if apps.exists():
            latest_action = apps.first().get_status_display()
            
        score = 0
        try:
            profile = getattr(user, 'profile', None)
            if profile:
                fields_filled = bool(profile.middle_name and profile.dob and profile.gender and profile.id_number and profile.phone_number and profile.postal_address)
                if fields_filled:
                    score += 20
        except Exception:
            pass
            
        if user.education.exists():
            score += 30
            
        doc_count = user.documents.count()
        if doc_count >= 4:
            score += 50
        elif doc_count > 0:
            score += (doc_count * 12)
            
        if score > 100:
            score = 100
            
        return Response({
            "applications_count": applications_count,
            "profile_completeness_percentage": score,
            "latest_action": latest_action
        })
