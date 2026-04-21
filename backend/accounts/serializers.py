import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Profile,
    Education,
    Experience,
    Training,
    ProfessionalMembership,
    Document,
)
from .utils import verify_recaptcha

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    recaptcha = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        recaptcha_token = attrs.pop("recaptcha", None)
        if not verify_recaptcha(recaptcha_token):
            raise serializers.ValidationError(
                {"recaptcha": "Invalid reCAPTCHA. Please try again."}
            )

        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "first_name", "last_name")


class UserManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("username", "email", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    recaptcha = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "recaptcha",
        )

    def validate_recaptcha(self, value):
        if not verify_recaptcha(value):
            raise serializers.ValidationError("Invalid reCAPTCHA. Please try again.")
        return value

    def validate_password(self, value):
        if len(value) < 8 or len(value) > 16:
            raise serializers.ValidationError(
                "Password must be between 8 and 16 characters."
            )
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter."
            )
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )
        if not re.search(r"[^A-Za-z0-9]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role="APPLICANT",
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        source="user.first_name", required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        source="user.last_name", required=False, allow_blank=True
    )
    email = serializers.EmailField(
        source="user.email", required=False, allow_blank=True
    )

    class Meta:
        model = Profile
        exclude = ("user",)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if user_data:
            user = instance.user
            if "first_name" in user_data:
                user.first_name = user_data["first_name"]
            if "last_name" in user_data:
                user.last_name = user_data["last_name"]
            if "email" in user_data:
                user.email = user_data["email"]
            user.save()
        return super().update(instance, validated_data)


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        exclude = ("user",)


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        exclude = ("user",)


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        exclude = ("user",)


class ProfessionalMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalMembership
        exclude = ("user",)


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        exclude = ("user",)
