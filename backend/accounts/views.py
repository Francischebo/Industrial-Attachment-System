from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import AnonRateThrottle
from .models import (
    Profile,
    Education,
    Experience,
    Training,
    ProfessionalMembership,
    Document,
)
from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    EducationSerializer,
    ExperienceSerializer,
    TrainingSerializer,
    ProfessionalMembershipSerializer,
    DocumentSerializer,
    UserManagementSerializer,
    CustomTokenObtainPairSerializer,
)
from jobs.models import Application
import string
import random
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import verify_google_token


class AuthThrottle(AnonRateThrottle):
    scope = "auth"


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthThrottle]


class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [AuthThrottle]

    def post(self, request):
        token = request.data.get("tokenId")
        if not token:
            return Response(
                {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            idinfo = verify_google_token(token)
            email = idinfo.get("email")
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")

            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password="".join(
                        random.choices(string.ascii_letters + string.digits, k=16)
                    ),
                    first_name=first_name,
                    last_name=last_name,
                    role="APPLICANT",
                )

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "is_superuser": user.is_superuser,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class IsManagementRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method == "DELETE" and request.user.role == "HR" and not request.user.is_superuser:
            return False
        return request.user.role in ["ADMIN", "HR"] or request.user.is_superuser


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [AuthThrottle]


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

        # Check if the user is the owner or management
        if document.user != request.user and request.user.role not in ["ADMIN", "HR"]:
            from django.core.exceptions import PermissionDenied

            raise PermissionDenied("You do not have permission to view this file.")

        if not document.file:
            raise Http404("File not found")

        return FileResponse(document.file.open("rb"), content_type="application/pdf")


class UserManagementListView(generics.ListAPIView):
    serializer_class = UserManagementSerializer
    permission_classes = (IsManagementRole,)

    def get_queryset(self):
        queryset = User.objects.all().order_by("-date_joined")
        if self.request.user.role == "HR":
            return queryset.exclude(role="ADMIN")
        return queryset


class UserManagementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserManagementSerializer
    permission_classes = (IsManagementRole,)

    def get_queryset(self):
        queryset = User.objects.all()
        # Superusers see everything
        if self.request.user.is_superuser:
            return queryset
        # HR users cannot see/edit ADMINs
        if self.request.user.role == "HR":
            return queryset.exclude(role="ADMIN")
        return queryset


class DashboardStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = (
            User.objects.select_related("profile")
            .prefetch_related("education", "documents")
            .get(id=request.user.id)
        )
        apps_list = list(Application.objects.filter(user=user).order_by("-applied_at"))
        applications_count = len(apps_list)

        latest_action = "None"
        if apps_list:
            latest_action = apps_list[0].get_status_display()

        score = 0
        try:
            profile = getattr(user, "profile", None)
            if profile:
                fields_filled = bool(
                    profile.middle_name
                    and profile.dob
                    and profile.gender
                    and profile.id_number
                    and profile.phone_number
                    and profile.postal_address
                )
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
            score += doc_count * 12

        if score > 100:
            score = 100

        return Response(
            {
                "applications_count": applications_count,
                "profile_completeness_percentage": score,
                "latest_action": latest_action,
            }
        )
