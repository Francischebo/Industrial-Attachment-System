from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('APPLICANT', 'Applicant'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='APPLICANT')
    
    def __str__(self):
        return self.username

class Profile(models.Model):
    OPPORTUNITY_CHOICES = (
        ('ATTACHMENT', 'Industrial Attachment'),
        ('INTERNSHIP', 'Youth Internship'),
        ('NONE', 'Not Selected'),
    )
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    MARITAL_STATUS_CHOICES = (
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    opportunity_type = models.CharField(max_length=20, choices=OPPORTUNITY_CHOICES, default='NONE')
    middle_name = models.CharField(max_length=150, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    postal_address = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, default='Kenyan')
    phone_number = models.CharField(max_length=15, blank=True)
    id_number = models.CharField(max_length=20, blank=True)
    kra_pin = models.CharField(max_length=20, blank=True)
    nssf_number = models.CharField(max_length=20, blank=True)
    nhif_number = models.CharField(max_length=20, blank=True)
    county_of_residence = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f'{self.user.username} Profile'

class Education(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='education')
    institution = models.CharField(max_length=200)
    qualification = models.CharField(max_length=100)
    grade_award = models.CharField(max_length=100, blank=True)
    field_of_study = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)

class Experience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experience')
    organization = models.CharField(max_length=200)
    employer_contact = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    responsibilities = models.TextField()

class Training(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trainings')
    name = models.CharField(max_length=200)
    institution = models.CharField(max_length=200)
    year = models.IntegerField()

class ProfessionalMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    body_name = models.CharField(max_length=200)
    membership_number = models.CharField(max_length=100)
    status = models.CharField(max_length=50)

class Document(models.Model):
    DOCUMENT_TYPES = (
        ('TRANSCRIPT', 'Transcripts'),
        ('NATIONAL_ID', 'National ID'),
        ('RESUME', 'Resume/CV'),
        ('COVER_LETTER', 'Cover Letter'),
        ('INSTITUTION_INTRO', 'Introduction Letter from Institution'),
        ('GOOD_CONDUCT', 'Certificate of Good Conduct'),
        ('STUDENT_INSURANCE', 'Student Insurance Cover'),
        ('STUDENT_ID', 'Copy of Student ID'),
        ('NEXT_OF_KIN_ID', 'Copy of Next of Kin (ID & Phone)'),
        ('KRA_PIN', 'KRA PIN Certificate'),
        ('SHA_CARD', 'SHA Card'),
        ('NSSF_CARD', 'NSSF Card'),
        ('BIRTH_CERT', 'Birth Certificate'),
        ('ACADEMIC_CERT', 'Academic Certificates'),
        ('SECRETS_ACT_FORM', 'Official Secrets Act Form'),
        ('PSIP_FORM', 'PSIP Intern Biodata Form'),
        ('PASSPORT_PHOTOS', 'Two Colour Passport Photos (PDF)'),
        ('ATM_CARD', 'ATM Card / Bank Details'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='secure_docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'document_type')

    def __str__(self):
        return f'{self.user.username} - {self.get_document_type_display()}'
