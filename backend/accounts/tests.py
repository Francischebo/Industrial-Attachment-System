from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='12345', password='password123')

    def test_login(self):
        response = self.client.post('/api/accounts/login/', {'username': '12345', 'password': 'password123'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
