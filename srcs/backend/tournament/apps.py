from django.apps import AppConfig
from django.db.models.signals import post_migrate


class TournamentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tournament'
    def ready(self):
        from .models import Tournament

        def cancel_active_and_pending_tournaments(sender, **kwargs):
            Tournament.objects.filter(status__in=[1, 2]).update(status=4)
        post_migrate.connect(cancel_active_and_pending_tournaments, sender=self)