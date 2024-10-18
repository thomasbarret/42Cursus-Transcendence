from django.db import models
from authentication.models import User

import uuid

class UserRelation(models.Model):
    relation_type = (
        (1, "FRIEND"),
        (2, "BLOCK"),
    )
    relation_status = (
        (1, "PENDING"),
        (2, "ACCEPTED"),
        (3, "REJECTED"),
    )

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    type = models.IntegerField(choices=relation_type)
    status = models.IntegerField(choices=relation_status)
    user_1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_1')
    user_2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_2')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_user')
    created_at = models.DateTimeField(auto_now_add=True)