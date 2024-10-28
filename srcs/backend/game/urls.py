from django.urls import path
from .views import (
    CreateMatchView,
    GetMatchView,
    JoinMatchView,

    PongViewSimulationTest,
)

urlpatterns = [
    path("match/create", CreateMatchView.as_view(), name="match_create"),

    path("match/<uuid:match_uuid>", GetMatchView.as_view(), name="match"),
    path("match/join", JoinMatchView.as_view(), name="match_join"),
    path("simulation", PongViewSimulationTest.as_view(), name="match_join"),
]
