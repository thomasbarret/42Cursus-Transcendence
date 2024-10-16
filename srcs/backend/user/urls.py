from django.urls import path
from .views import (
    ProfilView
)

urlpatterns = [
    path('<uuid:user_uuid>/', ProfilView.as_view(), name='profile'),
    path('@me/', ProfilView.as_view(), name='my_profile'),]
