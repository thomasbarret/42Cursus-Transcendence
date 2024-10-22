from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from asgiref.sync import sync_to_async, async_to_sync  # Utilise sync_to_async


class AuthenticationConfig(AppConfig):
    name = 'authentication'

    def ready(self):
        # Connecte la fonction `set_all_users_offline` au signal `post_migrate`
        post_migrate.connect(set_all_users_offline)

@receiver(post_migrate)
def set_all_users_offline(sender, **kwargs):
    @sync_to_async
    def update_users_status():
        from .models import PublicUser  # Importer ici pour éviter les problèmes de portée
        users = PublicUser.objects.all()
        for user in users:
            user.set_status('offline')

    # error quand on migrate
    async_to_sync(update_users_status)()
