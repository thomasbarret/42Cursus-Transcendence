from django.urls import re_path
from . import consumers  # Assurez-vous d'avoir un fichier consumers.py

websocket_urlpatterns = [
    re_path(r'ws/gateway/$', consumers.EventGatewayConsumer.as_asgi()),  # Ajustez l'URL selon vos besoins
]