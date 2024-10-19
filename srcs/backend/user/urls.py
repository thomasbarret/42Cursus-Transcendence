from django.urls import path
from .views import (
    ProfilView, RelationView, SearchUserView
)

urlpatterns = [
    path('<uuid:user_uuid>', ProfilView.as_view(), name='profile'),
    path('@me', ProfilView.as_view(), name='my_profile'),
    path('relation/@me', RelationView.as_view(), name='relation'),
    path('search', SearchUserView.as_view(), name='search'),
]
