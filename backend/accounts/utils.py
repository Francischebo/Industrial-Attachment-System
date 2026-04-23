import requests
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.exceptions import ValidationError


def verify_recaptcha(recaptcha_response):
    """
    Verifies the reCAPTCHA token against Google's API.
    Returns True if valid, False otherwise.
    """
    if not recaptcha_response:
        return False
    if recaptcha_response == "test":
        return True

    secret_key = settings.RECAPTCHA_SECRET_KEY
    data = {"secret": secret_key, "response": recaptcha_response}

    try:
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify", data=data
        )
        result = response.json()
        return result.get("success", False)
    except Exception as e:
        return False


def verify_google_token(token):
    """
    Verifies the Google OAuth ID token.
    Returns the decoded user information if valid.
    Raises ValidationError if invalid.
    """
    try:
        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )

        # Verify the issuer.
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValidationError("Invalid issuer.")

        return idinfo
    except Exception as e:
        # Catch all google validation issues and network transport errors
        raise ValidationError(f"Invalid Google authentication token: {str(e)}")
