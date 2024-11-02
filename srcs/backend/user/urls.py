from django.urls import path
from .views import (
    ProfilView, RelationView, SearchUserView, ProfilMatchView, ProfilTournamentView
)

urlpatterns = [
    path('<uuid:user_uuid>', ProfilView.as_view(), name='profile'),
    path('@me', ProfilView.as_view(), name='my_profile'),
    path('@me/match', ProfilMatchView.as_view(), name='match'),
    path('<uuid:user_uuid>/match', ProfilMatchView.as_view(), name='match'),

    path('@me/tournament', ProfilTournamentView.as_view(), name='tournament'),
    path('<uuid:user_uuid>/tournament', ProfilTournamentView.as_view(), name='tournament'),

    path('relation/@me', RelationView.as_view(), name='relation'),
    path('search', SearchUserView.as_view(), name='search'),
]
