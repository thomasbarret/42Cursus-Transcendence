import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match, ChatMessage
from django.contrib.auth.models import User

class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.match_group_name = f'match_{self.match_id}'

        await self.channel_layer.group_add(
            self.match_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.match_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']

        if message_type == 'chat_message':
            await self.save_chat_message(data['message'])
            await self.channel_layer.group_send(
                self.match_group_name,
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'user': self.scope['user'].username
                }
            )
        elif message_type == 'game_update':
            await self.channel_layer.group_send(
                self.match_group_name,
                {
                    'type': 'game_update',
                    'game_state': data['game_state']
                }
            )
        elif message_type == 'game_over':
            await self.end_match(data['winner'])
            await self.channel_layer.group_send(
                self.match_group_name,
                {
                    'type': 'game_over',
                    'winner': data['winner']
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user': event['user']
        }))

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'game_state': event['game_state']
        }))

    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_over',
            'winner': event['winner']
        }))

    @database_sync_to_async
    def save_chat_message(self, message):
        match = Match.objects.get(id=self.match_id)
        ChatMessage.objects.create(match=match, user=self.scope['user'], message=message)

    @database_sync_to_async
    def end_match(self, winner_username):
        match = Match.objects.get(id=self.match_id)
        winner = User.objects.get(username=winner_username)
        match.winner = winner
        match.is_finished = True
        match.save()
