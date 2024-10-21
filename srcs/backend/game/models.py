from django.db import models
from authentication.models import User

class MatchPlayer(models.Model):

    status_type = (
        (1, "ACTIVE"),
        (2, "INACTIVE"),
    )

    status = models.IntegerField(choices=status_type, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=10)

class Match(models.Model):
    status_type = (
        (2, "ACTIVE"),
        (3, "FINISHED"),
        (4, "CANCELLED"),
    )


    player1 = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='player2')

    player1_score = models.IntegerField()
    player2_score = models.IntegerField()

    winner = models.ForeignKey(MatchPlayer, on_delete=models.CASCADE, related_name='winner')
    max_score = models.IntegerField()

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

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


