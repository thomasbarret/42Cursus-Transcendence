from django.db import models
from authentication.models import User

import uuid

balls_direction = (
    (1, "RIGHT_UP"),
    (2, "RIGHT_DOWN"),
    (3, "LEFT_UP"),
    (4, "LEFT_DOWN"),
)

class MatchPlayer(models.Model):
    status_type = (
        (1, "ACTIVE"),
        (2, "INACTIVE"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.IntegerField(choices=status_type, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=10)

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

class Tournament(models.Model):
    status_type = (
        (1, "PENDING"),
        (2, "ACTIVE"),
        (3, "COMPLETED"),
        (4, "CANCELLED"),
    )
    status = models.IntegerField(choices=status_type)
    name = models.CharField(max_length=255)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    max_players = models.IntegerField()
    max_score = models.IntegerField()
    match_duration = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    players = models.ManyToManyField(MatchPlayer, related_name='tournaments')
    chat = models.OneToOneField('chat.Channel', on_delete=models.CASCADE, null=True, blank=True)

# Nouveau modèle pour les rounds
class TournamentRound(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='rounds')
    round_number = models.IntegerField()
    status = models.IntegerField(choices=(
        (1, "PENDING"),
        (2, "IN_PROGRESS"),
        (3, "COMPLETED")
    ))
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tournament', 'round_number')
        ordering = ['round_number']

class TournamentMatch(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_matches')
    round = models.ForeignKey(TournamentRound, on_delete=models.CASCADE, related_name='matches')
    match = models.OneToOneField(Match, on_delete=models.CASCADE)
    match_order = models.IntegerField()

    class Meta:
        unique_together = ('round', 'match_order')
        ordering = ['match_order']