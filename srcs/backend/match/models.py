from django.db import models
from django.contrib.auth.models import User

class Match(models.Model):
    player1 = models.ForeignKey(User, related_name='matches_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name='matches_as_player2', on_delete=models.CASCADE)
    winner = models.ForeignKey(User, related_name='matches_won', null=True, blank=True, on_delete=models.SET_NULL)
    is_finished = models.BooleanField(default=False)
    player2_score = models.IntegerField(null=True, blank=True)
    player1_score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMessage(models.Model):
    match = models.ForeignKey(Match, related_name='chat_messages', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)