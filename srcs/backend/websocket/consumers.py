import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class EventGatewayConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None  # Initialise à None

        self.user = await self.get_user_from_cookie(self.scope)

        if self.user and self.user.is_authenticated:
            print(f"User {self.user.uuid} {self.user.username} connected.")
            self.user_id = self.user.uuid
            self.group_name = f"user_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.update_user_status('online')
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.group_name:  # Vérifie si group_name est défini
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.update_user_status('offline')

    async def receive(self, text_data):
        try :
            text_data_json = json.loads(text_data)
            if 'event' not in text_data_json or 'data' not in text_data_json:
                return await self.send(text_data=json.dumps({
                    'event': 'ERROR',
                    'data': {'message': 'Event and data are required.'}
                }))

            event = text_data_json['event']
            data = text_data_json['data']

            await self.send(text_data=json.dumps({
                'event': 'RESPONSE_EVENT',
                'data': {'message': f'Event {event} received.'}
            }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'event': 'ERROR',
                'data': {'message': 'Invalid JSON data.'}
            }))

    async def send_event(self, event):
        event_name = event.get("event_name")
        data = event.get("data")

        await self.send(text_data=json.dumps({
            'event': event_name,
            'data': data
        }))

    async def get_user_from_cookie(self, scope):
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        from django.contrib.auth import get_user_model

        User = get_user_model()

        access_token = scope.get("cookies", {}).get('access_token')
        if not access_token:
            return None

        jwt_auth = JWTAuthentication()
        try:
            validated_token = await database_sync_to_async(jwt_auth.get_validated_token)(access_token)
            user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
            return user
        except (InvalidToken, TokenError):
            return None
    @database_sync_to_async
    def update_user_status(self, status):
        from authentication.models import PublicUser
        public_user = PublicUser.objects.get(user=self.user)  # Assurez-vous que cela fonctionne pour votre modèle
        public_user.set_status(status)