import json
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class EventGatewayConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None  # Initialise à None

        self.user = await self.get_user_from_cookie(self.scope)

        if self.user and self.user.is_authenticated:
            print(f"User {self.user.uuid} {self.user.username} connected.")
            self.group_name = f"user_{self.user.uuid}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.update_user_status('online')
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.group_name:
            from game.models import Match, MatchPlayer, Tournament
            from django.db.models import Q

            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.update_user_status('offline')

            # Utilisation correcte de database_sync_to_async pour les opérations sur la base de données
            matchs = await database_sync_to_async(lambda: list(Match.objects.filter(
                Q(status__in=[1, 2]) & (Q(player1__user=self.user) | Q(player2__user=self.user))
            )))()


            for match in matchs:
                if match.status == 1:
                    match.status = 4
                    await database_sync_to_async(match.save)()
                elif match.status == 2:
                    match.status = 3

                    winner = match.player1 if match.player1.user == self.user else match.player2
                    match.winner = winner
                    self.channel_layer.group_send(
                        f"user_{str(match.winner.user.uuid)}",
                        {
                            "type": "send_event",
                            "event_name": "GAME_MATCH_OPPONENT_DISCONNECTED",
                            "data": {
                                "uuid": match.uuid,
                                "status": match.status,
                                "player_1": {
                                    "uuid": match.player1.uuid,
                                    "display_name": match.player1.display_name,
                                    "user": {
                                        "uuid": match.player1.user.uuid,
                                        "username": match.player1.user.username,
                                        "display_name": match.player1.user.publicuser.display_name,
                                        "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                                    },
                                },
                                "player_2": {
                                    "uuid": match.player2.uuid,
                                    "display_name": match.player2.display_name,
                                    "user": {
                                        "uuid": match.player2.user.uuid,
                                        "username": match.player1.user.username,
                                        "display_name": match.player2.user.publicuser.display_name,
                                        "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                                    },
                                },
                                "player1_score": match.player1_score,
                                "player2_score": match.player2_score,
                                "winner": {
                                    "uuid": match.winner.uuid,
                                    "display_name": match.winner.display_name,
                                    "user": {
                                        "uuid": match.winner.user.uuid,
                                        "display_name": match.winner.user.publicuser.display_name,
                                        "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                                    },
                                } if match.winner else None,
                                "max_score": match.max_score,
                                "start_date": match.start_date,
                                "end_date": match.end_date,
                                "created_at": match.created_at,
                                "updated_at": match.updated_at,
                            }
                        }
                    )

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

            if event == 'GAME_MATCH_PADDLE_UPDATE':
                match_uuid = data.get('uuid')
                paddle_position = data.get('paddle_position')
                ball_position = data.get('ball_position')
                user_uuid = data.get('user_uuid')

                if not match_uuid or not paddle_position:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Match UUID and paddle position are required.'}
                    }))

                from game.models import Match
                from django.db.models import Q

                match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related('player1__user', 'player2__user').first)()
                if not match:
                    return await self.send(text_data=json.dumps({
                        'event': 'GAME_MATCH_NOT_FOUND',
                        'data': {'message': 'Match not found.'}
                    }))

                if match.status != 2:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Match is not active.'}
                    }))

                if match.player1.user != self.user and match.player2.user != self.user:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'You are not a player in this match.'}
                    }))

                player = match.player1 if match.player1.user == self.user else match.player2

                await self.channel_layer.group_send(
                    f"user_{str(match.player1.user.uuid)}",
                    {
                        'type': 'send_event',
                        'event_name': 'GAME_MATCH_PADDLE_UPDATE',
                        'data': {
                            'uuid': str(match.uuid),
                            'player_uuid': str(player.uuid),
                            'paddle_position': paddle_position,
                            'ball_position': ball_position,

                        }
                    }
                )
                await self.channel_layer.group_send(
                    f"user_{str(match.player2.user.uuid)}",
                    {
                        'type': 'send_event',
                        'event_name': 'GAME_MATCH_PADDLE_UPDATE',
                        'data': {
                            'uuid': str(match.uuid),
                            'player_uuid': str(player.uuid),
                            'paddle_position': paddle_position,
                            'ball_position': ball_position,
                        }
                    }
                )



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