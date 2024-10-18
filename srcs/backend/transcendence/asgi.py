import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from websocket.consumers import EventGatewayConsumer
from django.urls import re_path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcendence.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            [
                re_path(r"^ws/gateway/$", EventGatewayConsumer.as_asgi()),
            ]
        )
    ),
})
