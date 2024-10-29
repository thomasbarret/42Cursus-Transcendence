from django.db import models
from authentication.models import User
from chat.models import Channel

import uuid

class MatchPlayer(models.Model):
    status_type = (
        (1, "ACTIVE"),
        (2, "INACTIVE"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.IntegerField(choices=status_type, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    display_name = models.CharField()

class Match(models.Model):
    status_type = (
        (1, "PENDING"),
        (2, "ACTIVE"),
        (3, "FINISHED"),
        (4, "CANCELLED"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.IntegerField(choices=status_type, default=1)
    player1 = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='player2', null=True, blank=True)
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()

    winner = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='winner', null=True, blank=True)
    max_score = models.IntegerField()
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    tournament = models.ForeignKey(
        'tournament.Tournament',
        on_delete=models.CASCADE,
        related_name='tournament_matches',
        null=True,
        blank=True
    )