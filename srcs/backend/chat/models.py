from django.db import models
from django.core.exceptions import ValidationError
from authentication.models import (
    User,
    PublicUser,
)

import uuid

class Channel(models.Model):
    channel_type = (
        (1, "DM"),
        (2, "MATCH"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    type = models.IntegerField(choices=channel_type)
    users = models.ManyToManyField(User, related_name='channels')
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    message_type = (
        (1, "TEXT"),
        (2, "GAME_INVITATION"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    type = models.IntegerField(choices=message_type)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    # game = models.ForeignKey(Game, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def condition(self):
        if self.type == 1 and self.user is None:
            return ValidationError("User is required for text messages")

    def save(self, *args, **kwargs):
        self.condition()
        return super().save(*args, **kwargs)