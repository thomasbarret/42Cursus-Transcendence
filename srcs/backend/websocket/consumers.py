import json
from django.core.cache import cache
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from asgiref.sync import sync_to_async
import asyncio
from django.utils import timezone

class GameState:
    def __init__(self, match_uuid, player1_uuid, player2_uuid, max_score=5):
        self.max_score = max_score
        self.match_uuid = match_uuid
        self.player1_uuid = player1_uuid
        self.player2_uuid = player2_uuid

        self.canvas_width = 800
        self.canvas_height = 600
        self.paddle_height = 100
        self.paddle_width = 10
        self.ball_radius = 10

        self.paddle1_y = (self.canvas_height - self.paddle_height) / 2
        self.paddle2_y = (self.canvas_height - self.paddle_height) / 2

        self.paddle_speed = 300
        self.player1_direction = 0 # -1: up, 0: IDLE, 1: down -> a changer ptetre
        self.player2_direction = 0

        self.ball_x = self.canvas_width / 2
        self.ball_y = self.canvas_height / 2

        self.ball_vx = 200
        self.ball_vy = 150

        self.player1_score = 0
        self.player2_score = 0

class GameManager:
    def __init__(self):
        self.games = {}

    async def start_game(self, match_uuid, player1_uuid, player2_uuid, max_score, channel_layer):
        if match_uuid in self.games:
            return
        game_state = GameState(match_uuid, player1_uuid, player2_uuid, max_score)
        self.games[match_uuid] = game_state
        asyncio.create_task(self.game_loop(match_uuid, channel_layer))

    async def game_loop(self, match_uuid, channel_layer):
        game_state = self.games[match_uuid]
        last_time = asyncio.get_event_loop().time()
        while True:

            current_time = asyncio.get_event_loop().time()
            delta_time = current_time - last_time
            last_time = current_time

            self.update_game_state(game_state, delta_time)

            await channel_layer.group_send(
                f"match_{match_uuid}",
                {
                    "type": "send_event",
                    "event_name": "GAME_STATE_UPDATE",
                    "data": {
                        'uuid': str(match_uuid),
                        'state': self.serialize_game_state(game_state),
                    }
                }
            )

            if game_state.player1_score >= game_state.max_score or game_state.player2_score >= game_state.max_score:
                winner_uuid = game_state.player1_uuid if game_state.player1_score >= game_state.max_score else game_state.player2_uuid
                await self.end_game(match_uuid, winner_uuid, channel_layer)
                cache.set(f"{match_uuid}_finished", True)
                break

            if cache.get(f"{match_uuid}_finished"):
                break

            await asyncio.sleep(1 / 60)

    def update_game_state(self, game_state: GameState, delta_time):
        game_state.paddle1_y += game_state.player1_direction * game_state.paddle_speed * delta_time
        game_state.paddle2_y += game_state.player2_direction * game_state.paddle_speed * delta_time

        game_state.paddle1_y = max(0, min(game_state.canvas_height - game_state.paddle_height, game_state.paddle1_y))
        game_state.paddle2_y = max(0, min(game_state.canvas_height - game_state.paddle_height, game_state.paddle2_y))

        game_state.ball_x += game_state.ball_vx * delta_time
        game_state.ball_y += game_state.ball_vy * delta_time

        if game_state.ball_y - game_state.ball_radius <= 0 or game_state.ball_y + game_state.ball_radius >= game_state.canvas_height:
            game_state.ball_vy *= -1

        self.check_paddle_collision(game_state)

        self.check_scoring(game_state)

    def check_paddle_collision(self, game_state: GameState):
        if (game_state.ball_x - game_state.ball_radius <= game_state.paddle_width and
            game_state.paddle1_y <= game_state.ball_y <= game_state.paddle1_y + game_state.paddle_height):
            game_state.ball_vx = abs(game_state.ball_vx)
            hit_pos = ((game_state.ball_y - game_state.paddle1_y) / game_state.paddle_height) - 0.5
            game_state.ball_vy += hit_pos * 300

        if (game_state.ball_x + game_state.ball_radius >= game_state.canvas_width - game_state.paddle_width and
            game_state.paddle2_y <= game_state.ball_y <= game_state.paddle2_y + game_state.paddle_height):
            # game_state.ball_vx *= -1
            game_state.ball_vx = -abs(game_state.ball_vx)
            hit_pos = ((game_state.ball_y - game_state.paddle2_y) / game_state.paddle_height) - 0.5
            game_state.ball_vy += hit_pos * 300

    def check_scoring(self, game_state: GameState):
        if game_state.ball_x < 0:
            game_state.player2_score += 1
            self.reset_ball(game_state, direction=1)
        elif game_state.ball_x > game_state.canvas_width:
            game_state.player1_score += 1
            self.reset_ball(game_state, direction=-1)

    def reset_ball(self, game_state: GameState, direction=1):
        game_state.ball_x = game_state.canvas_width / 2
        game_state.ball_y = game_state.canvas_height / 2
        game_state.ball_vx = 200 * direction
        game_state.ball_vy = 150

    def serialize_game_state(self, game_state: GameState):
        return {
            "player1_position": game_state.paddle1_y,
            "player2_position": game_state.paddle2_y,
            "ball_x": game_state.ball_x,
            "ball_y": game_state.ball_y,
            "player1_score": game_state.player1_score,
            "player2_score": game_state.player2_score,
        }

    def update_player_direction(self, match_uuid, player_uuid, direction):
        game_state = self.games.get(match_uuid)
        if not game_state:
            return
        if player_uuid == game_state.player1_uuid:
            game_state.player1_direction = direction
        elif player_uuid == game_state.player2_uuid:
            game_state.player2_direction = direction

    async def end_game(self, match_uuid, winner_uuid, channel_layer):
        game_state = self.games.get(match_uuid)
        if not game_state:
            return

        from game.models import Match, MatchPlayer

        match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related('player1__user__publicuser', 'player2__user__publicuser').first)()
        winner = await database_sync_to_async(MatchPlayer.objects.filter(uuid=winner_uuid).select_related('user__publicuser').first)()

        match.player1_score = game_state.player1_score
        match.player2_score = game_state.player2_score
        match.winner = winner
        match.status = 3
        match.end_date = timezone.now()
        await database_sync_to_async(match.save)()

        response = {
            "uuid": str(match.uuid),
            "status": match.status,
            "player_1": {
                "uuid": str(match.player1.uuid),
                "display_name": match.player1.display_name,
                "user": {
                    "uuid": str(match.player1.user.uuid),
                    "display_name": match.player1.user.publicuser.display_name,
                    "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                },
            },
            "player_2": {
                "uuid": str(match.player2.uuid),
                "display_name": match.player2.display_name,
                "user": {
                    "uuid": str(match.player2.user.uuid),
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                },
            },
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": {
                "uuid": str(match.winner.uuid),
                "display_name": match.winner.display_name,
                "user": {
                    "uuid": str(match.winner.user.uuid),
                    "display_name": match.winner.user.publicuser.display_name,
                    "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                },
            },
            "max_score": match.max_score,
            "start_date": match.start_date.isoformat() if match.start_date else None,
            "end_date": match.end_date.isoformat() if match.end_date else None,
            "created_at": match.created_at.isoformat(),
            "updated_at": match.updated_at.isoformat() if match.updated_at else None,
        }

        await channel_layer.group_send(
            f"match_{match_uuid}",
            {
                "type": "send_event",
                "event_name": "GAME_MATCH_FINISHED",
                "data": response
            }
        )

        self.stop_game(match_uuid)

    def stop_game(self, match_uuid):
        if match_uuid in self.games:
            del self.games[match_uuid]

game_manager = GameManager()

class EventGatewayConsumer(AsyncWebsocketConsumer):

    match_player_ready = {}

    async def connect(self):
        self.group_name = None  # Initialise à None

        self.user = await self.get_user_from_cookie(self.scope)

        if self.user and self.user.is_authenticated:
            print(f"User {self.user.uuid} {self.user.username} connected.")
            self.group_name = f"user_{self.user.uuid}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.update_user_status('online')

            from game.models import Match
            from django.db.models import Q

            matches = await database_sync_to_async(lambda: list(Match.objects.filter(
                Q(status=2) & (Q(player1__user=self.user) | Q(player2__user=self.user))
            ).select_related("player1__user__publicuser", "player2__user__publicuser")))()

            for match in matches:
                match_uuid = str(match.uuid)
                await self.channel_layer.group_add(f"match_{match_uuid}", self.channel_name)
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
            ).select_related("player1__user__publicuser", "player2__user__publicuser")))()

            for match in matchs:
                match_uuid = str(match.uuid)
                await self.channel_layer.group_discard(f"match_{match_uuid}", self.channel_name)
                await sync_to_async(game_manager.stop_game)(match_uuid)

            for match in matchs:
                if match.status == 1:
                    match.status = 4
                    await database_sync_to_async(match.save)()
                elif match.status == 2:
                    match.status = 3

                    player1 = await sync_to_async(lambda: match.player1)()
                    player2 = await sync_to_async(lambda: match.player2)()
                    winner = player1 if player1.user == self.user else player2
                    match.winner = winner
                    await self.channel_layer.group_send(
                        f"user_{str(match.winner.user.uuid)}",
                        {
                            "type": "send_event",
                            "event_name": "GAME_MATCH_OPPONENT_DISCONNECTED",
                            "data": {
                                "uuid": str(match.uuid),
                                "status": match.status,
                                "player_1": {
                                    "uuid": str(match.player1.uuid),
                                    "display_name": match.player1.display_name,
                                    "user": {
                                        "uuid": str(match.player1.user.uuid),
                                        "username": match.player1.user.username,
                                        "display_name": match.player1.user.publicuser.display_name,
                                        "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                                    },
                                },
                                "player_2": {
                                    "uuid": str(match.player2.uuid),
                                    "display_name": match.player2.display_name,
                                    "user": {
                                        "uuid": str(match.player2.user.uuid),
                                        "username": match.player1.user.username,
                                        "display_name": match.player2.user.publicuser.display_name,
                                        "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                                    },
                                },
                                "player1_score": match.player1_score,
                                "player2_score": match.player2_score,
                                "winner": {
                                    "uuid": str(match.winner.uuid),
                                    "display_name": match.winner.display_name,
                                    "user": {
                                        "uuid": str(match.winner.user.uuid),
                                        "display_name": match.winner.user.publicuser.display_name,
                                        "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                                    },
                                } if match.winner else None,
                                "max_score": match.max_score,
                                "start_date": match.start_date.isoformat() if match.start_date else None,
                                "end_date": match.end_date.isoformat() if match.end_date else None,
                                "created_at": match.created_at.isoformat(),
                                "updated_at": match.updated_at.isoformat() if match.updated_at else None,
                            }
                        }
                    )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            if 'event' not in text_data_json or 'data' not in text_data_json:
                return await self.send(text_data=json.dumps({
                    'event': 'ERROR',
                    'data': {'message': 'Event and data are required.'}
                }))

            event = text_data_json['event']
            data = text_data_json['data']

            if event == "GAME_MATCH_READY":
                match_uuid = data.get('uuid')
                if not match_uuid:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Match UUID is required.'}
                    }))

                from game.models import Match
                match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related('player1__user', 'player2__user').first)()
                if not match.player2:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Match is not ready.'}
                    }))

                if not match or self.user not in [match.player1.user, match.player2.user]:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Invalid match or user.'}
                    }))



                if self.user == match.player1.user:
                    if cache.get(f"{match_uuid}_player1_ready"):
                        return await self.send(text_data=json.dumps({
                            'event': 'ERROR',
                            'data': {'message': 'Player 1 is already ready.'}
                        }))
                    else:
                        await self.channel_layer.group_add(f"match_{match_uuid}", self.channel_name)
                        cache.set(f"{match_uuid}_player1_ready", True)
                elif self.user == match.player2.user:
                    if cache.get(f"{match_uuid}_player2_ready"):
                        return await self.send(text_data=json.dumps({
                            'event': 'ERROR',
                            'data': {'message': 'Player 2 is already ready.'}
                        }))
                    else:
                        await self.channel_layer.group_add(f"match_{match_uuid}", self.channel_name)
                        cache.set(f"{match_uuid}_player2_ready", True)

                if not cache.get(f"{match_uuid}_player1_ready") or not cache.get(f"{match_uuid}_player2_ready"):
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Second player are not ready.'}
                    }))

                player1_uuid = str(match.player1.uuid)
                player2_uuid = str(match.player2.uuid)
                max_score = match.max_score
                await game_manager.start_game(match_uuid, player1_uuid, player2_uuid, max_score, self.channel_layer)

            elif event == "GAME_MATCH_INPUT":
                match_uuid = data.get('uuid')
                direction = data.get('direction')

                if match_uuid is None or direction is None:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Match UUID and direction are required.'}
                    }))


                from game.models import Match
                match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related('player1__user', 'player2__user').first)()

                player_uuid = str(match.player1.uuid) if match.player1.user == self.user else str(match.player2.uuid)
                await sync_to_async(game_manager.update_player_direction)(match_uuid, player_uuid, direction)


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