from django.urls import path
from .views import (
    CreateTournamentView,
    GetTournamentView,
    JoinTournamentView,
)

urlpatterns = [
    path("tournament/create", CreateTournamentView.as_view(), name="tournament_create"),
    path("tournament/<uuid:match_uuid>", GetTournamentView.as_view(), name="tournament"),
    path("tournament/join", JoinTournamentView.as_view(), name="tournament_join"),
]
