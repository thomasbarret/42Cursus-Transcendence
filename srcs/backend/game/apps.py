from django.apps import AppConfig
from django.db.models.signals import post_migrate


class GameConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'game'
    def ready(self):
        from .models import Match

        def cancel_active_and_pending_matches(sender, **kwargs):
            Match.objects.filter(status__in=[1, 2]).update(status=4)  # 1 = PENDING, 2 = ACTIVE, 4 = CANCELLED

        post_migrate.connect(cancel_active_and_pending_matches, sender=self)