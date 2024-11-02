import json
from django.core.cache import cache
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from asgiref.sync import sync_to_async
import asyncio
from django.utils import timezone


import math
import random


def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class GameState:
    def __init__(self, match_uuid, player1_uuid, player2_uuid, max_score=5, tournament_uuid = None):

        self.tournament_uuid = tournament_uuid

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

        self.paddle_speed = 320
        self.player1_direction = 0 # -1: up, 0: IDLE, 1: down -> a changer ptetre
        self.player2_direction = 0

        self.ball_x = self.canvas_width / 2
        self.ball_y = self.canvas_height / 2

        self.ball_velocity = 500

        self.ball_vx = 400
        self.ball_vy = 300

        self.player1_score = 0
        self.player2_score = 0

        self.max_angle_deviation = 45 * math.pi / 180
        self.initial_angle_deviation = 22.5 * math.pi / 180

        self.ball_active = True


class GameManager:
    def __init__(self):
        self.games: dict[str, GameState] = {}

    async def start_game(self, match_uuid, player1_uuid, player2_uuid, max_score, channel_layer, tournament_uuid = None):
        if match_uuid in self.games:
            return
        game_state = GameState(match_uuid, player1_uuid, player2_uuid, max_score, tournament_uuid)
        self.games[match_uuid] = game_state

        channel_layer = get_channel_layer()

        channel_layer.group_send((
            f"match_{game_state.match_uuid}",
            {
                "type": "send_event",
                "event_name": "GAME_START",
                "data": {
                    'uuid': str(game_state.match_uuid),
                    'p1_score': game_state.player1_score,
                    'p2_score': game_state.player2_score
                }
            }
        ))
        asyncio.create_task(self.game_loop(match_uuid, channel_layer))

    async def activate_ball(self, game_state: GameState):
        await asyncio.sleep(2);
        game_state.ball_active = True

    async def game_loop(self, match_uuid, channel_layer):
        game_state = self.games[match_uuid]
        last_time = asyncio.get_event_loop().time()
        while True:

            current_time = asyncio.get_event_loop().time()
            delta_time = current_time - last_time
            last_time = current_time

            if self.update_game_state(game_state, delta_time):
                await channel_layer.group_send(
                    f"match_{game_state.match_uuid}",
                    {
                        "type": "send_event",
                        "event_name": "GAME_SCORE_UPDATE",
                        "data": {
                            'uuid': str(game_state.match_uuid),
                            'p1_score': game_state.player1_score,
                            'p2_score': game_state.player2_score
                        }
                    }
                )
                if game_state.tournament_uuid:
                    await channel_layer.group_send(
                        f"tournament_{game_state.tournament_uuid}",
                        {
                            "type": "send_event",
                            "event_name": "GAME_SCORE_UPDATE",
                            "data": {
                                'uuid': str(game_state.match_uuid),
                                'p1_score': game_state.player1_score,
                                'p2_score': game_state.player2_score
                            }
                        }
                    )
                game_state.ball_active = False
                asyncio.create_task(self.activate_ball(game_state))

            state_update = {
                'uuid': str(match_uuid),
                "p1_pos": game_state.paddle1_y,
                "p2_pos": game_state.paddle2_y,
                "b_x": game_state.ball_x,
                "b_y": game_state.ball_y,
            }

            await channel_layer.group_send(
                f"match_{match_uuid}",
                {
                    "type": "send_event",
                    "event_name": "GAME_STATE_UPDATE",
                    "data": state_update
                }
            )

            if game_state.tournament_uuid:
                await channel_layer.group_send(
                    f"tournament_{game_state.tournament_uuid}",
                    {
                        "type": "send_event",
                        "event_name": "GAME_STATE_UPDATE",
                        "data": state_update
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
        if (game_state.player1_direction != 0):
            game_state.paddle1_y += game_state.player1_direction * game_state.paddle_speed * delta_time
        if (game_state.player2_direction != 0):
            game_state.paddle2_y += game_state.player2_direction * game_state.paddle_speed * delta_time

        collision_buffer = 1
        game_state.paddle1_y = max(collision_buffer, min(game_state.canvas_height - game_state.paddle_height - collision_buffer, game_state.paddle1_y))
        game_state.paddle2_y = max(collision_buffer, min(game_state.canvas_height - game_state.paddle_height - collision_buffer, game_state.paddle2_y))

        if game_state.ball_active:
            next_ball_x = game_state.ball_x + game_state.ball_vx * delta_time
            next_ball_y = game_state.ball_y + game_state.ball_vy * delta_time

            self.check_paddle_collision(game_state, next_ball_x, next_ball_y)

            self.check_wall_collision(game_state, next_ball_y)

            game_state.ball_x += game_state.ball_vx * delta_time
            game_state.ball_y += game_state.ball_vy * delta_time

        return self.check_scoring(game_state)

    def check_wall_collision(self, game_state: GameState, next_ball_y):
        if next_ball_y - game_state.ball_radius <= 0:
            game_state.ball_vy *= -1
            game_state.ball_y = game_state.ball_radius
        if next_ball_y + game_state.ball_radius >= game_state.canvas_height:
            game_state.ball_vy *= -1
            game_state.ball_y = game_state.canvas_height - game_state.ball_radius

    def check_paddle_collision(self, game_state: GameState, next_ball_x, next_ball_y):
        ball_radius = game_state.ball_radius
        paddle1 = {
            'x': 0,
            'y': game_state.paddle1_y,
            'width': game_state.paddle_width,
            'height': game_state.paddle_height
        }

        paddle2 = {
            'x': game_state.canvas_width - game_state.paddle_width,
            'y': game_state.paddle2_y,
            'width': game_state.paddle_width,
            'height': game_state.paddle_height
        }

        if (
            next_ball_x - ball_radius <= paddle1['x'] + paddle1['width'] and
            next_ball_x + ball_radius >= paddle1['x'] and
            next_ball_y + ball_radius >= paddle1['y'] and
            next_ball_y - ball_radius <= paddle1['y'] + paddle1['height']
            ):
            game_state.ball_x = paddle1['x'] + paddle1['width'] + ball_radius

            relative_intersect_y = (paddle1['y'] + paddle1['height'] / 2) - next_ball_y
            normalized_relative_angle = (relative_intersect_y / (paddle1['height'] / 2))
            bounce_angle = normalized_relative_angle * game_state.max_angle_deviation

            speed = math.sqrt(game_state.ball_vx ** 2 + game_state.ball_vy ** 2)
            game_state.ball_vx = speed * math.cos(bounce_angle)
            game_state.ball_vy = speed * -math.sin(bounce_angle)

        elif (
            next_ball_x + ball_radius >= paddle2['x'] and
            next_ball_x - ball_radius <= paddle2['x'] + paddle2['width'] and
            next_ball_y + ball_radius >= paddle2['y'] and
            next_ball_y - ball_radius <= paddle2['y'] + paddle2['height']
            ):
            game_state.ball_x = paddle2['x'] - ball_radius

            relative_intersect_y = (paddle2['y'] + paddle2['height'] / 2) - next_ball_y
            normalized_relative_angle = (relative_intersect_y / (paddle2['height'] / 2))
            bounce_angle = normalized_relative_angle * game_state.max_angle_deviation

            speed = math.sqrt(game_state.ball_vx ** 2 + game_state.ball_vy ** 2)
            game_state.ball_vx = -speed * math.cos(bounce_angle)
            game_state.ball_vy = speed * -math.sin(bounce_angle)

    def check_scoring(self, game_state: GameState):
        if game_state.ball_x < 0:
            game_state.player2_score += 1
            return self.reset_ball(game_state, direction=1)
        elif game_state.ball_x > game_state.canvas_width:
            game_state.player1_score += 1
            return self.reset_ball(game_state, direction=-1)
        return False

    def reset_ball(self, game_state: GameState, direction=1):
        game_state.ball_x = game_state.canvas_width / 2
        game_state.ball_y = game_state.canvas_height / 2

        speed = game_state.ball_velocity
        angle = random.uniform(-game_state.initial_angle_deviation, game_state.initial_angle_deviation)

        game_state.ball_vx = direction * speed * math.cos(angle)
        game_state.ball_vy = speed * math.sin(angle)
        return True

    def update_player_direction(self, match_uuid, player_uuid, direction):
        game_state = self.games.get(match_uuid)
        if not game_state:
            return
        if player_uuid == game_state.player1_uuid:
            game_state.player1_direction = direction
        else:
            game_state.player2_direction = direction

    async def end_game(self, match_uuid, winner_uuid, channel_layer):
        game_state = self.games.get(match_uuid)
        if not game_state:
            return

        from game.models import Match, MatchPlayer
        from tournament.models import Tournament

        match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related(
            'player1__user__publicuser',
            'player2__user__publicuser',
            'tournament'
            )
            .prefetch_related("tournament__players__user__publicuser").first)()
        winner = await database_sync_to_async(
            MatchPlayer.objects.filter(uuid=winner_uuid)
            .select_related('user__publicuser').first)()

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

        if match.tournament:
            await sync_to_async(match.tournament.start_next_match)()

            await database_sync_to_async(match.tournament.refresh_from_db)()

            tournament: Tournament = await database_sync_to_async(
                Tournament.objects.filter(uuid=match.tournament.uuid)
                .select_related('channel',
                                'created_by__user__publicuser',
                                'current_match__player1__user__publicuser',
                                'current_match__player2__user__publicuser',
                                'current_match__winner__user__publicuser',
                                'winner__user__publicuser').first)()

            players = await database_sync_to_async(
                lambda: list(tournament.players
                .select_related('user__publicuser')
                .all()))()

            players_data = []
            for player in players:
                player_data = {
                    'uuid': str(player.uuid),
                    'user': {
                        'uuid': str(player.user.uuid),
                        'display_name': player.user.publicuser.display_name,
                        'avatar': get_avatar_url(player.user)
                    }
                }
                players_data.append(player_data)

            matches = await database_sync_to_async(
                lambda: list(tournament.matches
                            .select_related('player1__user__publicuser',
                            'player2__user__publicuser',
                            'winner__user__publicuser')
                            .all()))()

            await channel_layer.group_send(
                f"tournament_{game_state.tournament_uuid}",
                {
                    "type": "send_event",
                    "event_name": "GAME_TOURNAMENT_NEXT_MATCH",
                    "data": {
                        'uuid': str(tournament.uuid),
                        'status': tournament.status,
                        'max_score': tournament.max_score,
                        'channel': {
                            'uuid': str(tournament.channel.uuid),
                            'type': tournament.channel.type,
                            'created_at': tournament.channel.created_at.isoformat(),
                        },
                        'creator': {
                            'uuid': str(tournament.created_by.uuid),
                            'user': {
                                'uuid': str(tournament.created_by.user.uuid),
                                'display_name': tournament.created_by.user.publicuser.display_name,
                                'avatar': get_avatar_url(tournament.created_by.user)
                            }
                        },
                        'players': players_data,
                        'winner' : {
                            "uuid": str(tournament.winner.uuid),
                            "display_name": tournament.winner.display_name,
                            "user": {
                                "uuid": str(tournament.winner.user.uuid),
                                "display_name": tournament.winner.user.publicuser.display_name,
                                "avatar": get_avatar_url(tournament.winner.user)
                            },

                        } if tournament.winner else None,
                        'current_match': {
                            "uuid": str(tournament.current_match.uuid),
                            "status": tournament.current_match.status,
                            "player_1": {
                                "uuid": str(tournament.current_match.player1.uuid),
                                "display_name": tournament.current_match.player1.display_name,
                                "user": {
                                    "uuid": str(tournament.current_match.player1.user.uuid),
                                    "display_name": tournament.current_match.player1.user.publicuser.display_name,
                                    "avatar": get_avatar_url(tournament.current_match.player1.user)
                                },
                            },
                            "player_2": {
                                "uuid": str(tournament.current_match.player2.uuid),
                                "display_name": tournament.current_match.player2.display_name,
                                "user": {
                                    "uuid": str(tournament.current_match.player2.user.uuid),
                                    "display_name": tournament.current_match.player2.user.publicuser.display_name,
                                    "avatar": get_avatar_url(tournament.current_match.player2.user)
                                } if tournament.current_match.player2 and tournament.current_match.player2.user else None
                            } if tournament.current_match.player2 else None,
                            "player1_score": tournament.current_match.player1_score,
                            "player2_score": tournament.current_match.player2_score,
                            "winner": {
                                "uuid": str(tournament.current_match.winner.uuid),
                                "display_name": tournament.current_match.winner.display_name,
                                "user": {
                                    "uuid": str(tournament.current_match.winner.user.uuid),
                                    "display_name": tournament.current_match.winner.user.publicuser.display_name,
                                    "avatar": tournament.current_match.winner.user.publicuser.avatar.url if tournament.current_match.winner.user.publicuser.avatar else None,
                                },
                            } if tournament.current_match.winner else None,
                            "max_score": tournament.current_match.max_score,
                            "start_date": tournament.current_match.start_date.isoformat() if tournament.current_match.start_date else None,
                            "end_date": tournament.current_match.end_date.isoformat() if tournament.current_match.end_date else None,
                            "created_at": tournament.current_match.created_at.isoformat(),
                            "updated_at": tournament.current_match.updated_at.isoformat(),
                        } if tournament.current_match else None,
                        'matches': [{
                        "uuid": str(match.uuid),
                        "status": match.status,
                        "player_1": {
                            "uuid": str(match.player1.uuid),
                            "display_name": match.player1.display_name,
                            "user": {
                                "uuid": str(match.player1.user.uuid),
                                "display_name": match.player1.user.publicuser.display_name,
                                "avatar": get_avatar_url(match.player1.user)
                            },
                        },
                        "player_2": {
                            "uuid": str(match.player2.uuid),
                            "display_name": match.player2.display_name,
                            "user": {
                                "uuid": str(match.player2.user.uuid),
                                "display_name": match.player2.user.publicuser.display_name,
                                "avatar": get_avatar_url(match.player2.user)
                            } if match.player2 and match.player2.user else None
                        } if match.player2 else None,
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
                    } for match in matches],
                        'created_at': tournament.created_at.isoformat(),
                    }
                }
            )

            if tournament.current_match and not tournament.winner:
                for i in range(5, -1, -1):
                    await channel_layer.group_send(
                    f"tournament_{game_state.tournament_uuid}",
                    {
                        "type": "send_event",
                        "event_name": "GAME_COUNTDOWN",
                        "data": i
                    })
                    if i > 0:
                        await asyncio.sleep(1)
                await game_manager.start_game(
                    str(tournament.current_match.uuid),
                    str(tournament.current_match.player1.uuid),
                    str(tournament.current_match.player2.uuid),
                    tournament.max_score,
                    channel_layer,
                    str(game_state.tournament_uuid)
                    )

        self.stop_game(match_uuid)

    def stop_game(self, match_uuid):
        if match_uuid in self.games:
            del self.games[match_uuid]

game_manager = GameManager()

class EventGatewayConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None  # Initialise à None

        self.user = None
        try:
            self.user = await self.get_user_from_cookie(self.scope)
        except:
            await self.close()
            return

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
            from game.models import Match, MatchPlayer
            from django.db.models import Q

            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.update_user_status('offline')

            # # Utilisation correcte de database_sync_to_async pour les opérations sur la base de données
            # matchs = await database_sync_to_async(lambda: list(Match.objects.filter(
            #     Q(status__in=[1, 2]) & (Q(player1__user=self.user) | Q(player2__user=self.user))
            # ).select_related("player1__user__publicuser", "player2__user__publicuser")))()

            # for match in matchs:
            #     match_uuid = str(match.uuid)
            #     await self.channel_layer.group_discard(f"match_{match_uuid}", self.channel_name)
            #     await sync_to_async(game_manager.stop_game)(match_uuid)

            # for match in matchs:
            #     if match.status == 1:
            #         match.status = 4
            #         await database_sync_to_async(match.save)()
            #     elif match.status == 2:
            #         match.status = 3

            #         player1 = await sync_to_async(lambda: match.player1)()
            #         player2 = await sync_to_async(lambda: match.player2)()
            #         winner = player1 if player1.user == self.user else player2
            #         match.winner = winner
            #         await self.channel_layer.group_send(
            #             f"user_{str(match.winner.user.uuid)}",
            #             {
            #                 "type": "send_event",
            #                 "event_name": "GAME_MATCH_OPPONENT_DISCONNECTED",
            #                 "data": {
            #                     "uuid": str(match.uuid),
            #                     "status": match.status,
            #                     "player_1": {
            #                         "uuid": str(match.player1.uuid),
            #                         "display_name": match.player1.display_name,
            #                         "user": {
            #                             "uuid": str(match.player1.user.uuid),
            #                             "username": match.player1.user.username,
            #                             "display_name": match.player1.user.publicuser.display_name,
            #                             "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
            #                         },
            #                     },
            #                     "player_2": {
            #                         "uuid": str(match.player2.uuid),
            #                         "display_name": match.player2.display_name,
            #                         "user": {
            #                             "uuid": str(match.player2.user.uuid),
            #                             "username": match.player1.user.username,
            #                             "display_name": match.player2.user.publicuser.display_name,
            #                             "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
            #                         },
            #                     },
            #                     "player1_score": match.player1_score,
            #                     "player2_score": match.player2_score,
            #                     "winner": {
            #                         "uuid": str(match.winner.uuid),
            #                         "display_name": match.winner.display_name,
            #                         "user": {
            #                             "uuid": str(match.winner.user.uuid),
            #                             "display_name": match.winner.user.publicuser.display_name,
            #                             "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
            #                         },
            #                     } if match.winner else None,
            #                     "max_score": match.max_score,
            #                     "start_date": match.start_date.isoformat() if match.start_date else None,
            #                     "end_date": match.end_date.isoformat() if match.end_date else None,
            #                     "created_at": match.created_at.isoformat(),
            #                     "updated_at": match.updated_at.isoformat() if match.updated_at else None,
            #                 }
            #             }
            #         )

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
                match = await database_sync_to_async(Match.objects.filter(uuid=match_uuid).select_related("player1__user__publicuser", "player2__user__publicuser").first)()

                if self.user != match.player1.user and self.user != match.player2.user:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Invalid match or user.'}
                    }))

                player_uuid = str(match.player1.uuid) if self.user == match.player1.user else str(match.player2.uuid)
                await sync_to_async(game_manager.update_player_direction)(match_uuid, player_uuid, direction)
            elif event == "TOURNAMENT_START":
                tournament_uuid = data.get('uuid')

                if not tournament_uuid:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Tournament UUID is required.'}
                    }))

                from tournament.models import Tournament

                tournament = await database_sync_to_async(
                    Tournament.objects.filter(uuid=tournament_uuid)
                    .select_related('created_by__user__publicuser')
                    .prefetch_related('players__user__publicuser')
                    .first
                )()

                if not tournament:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Invalid tournament.'}
                    }))

                if self.user != tournament.created_by.user:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'You are not the creator of this tournament.'}
                    }))

                players = await database_sync_to_async(lambda: list(tournament.players.all()))()

                if len(players) < 2:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Not enough players in the tournament.'}
                    }))

                await sync_to_async(tournament.create_all_matches)()

                players_data = []

                for player in players:
                    player_data = {
                        'uuid': str(player.uuid),
                        'user': {
                            'uuid': str(player.user.uuid),
                            'display_name': player.user.publicuser.display_name,
                            'avatar': get_avatar_url(player.user)
                        }
                    }
                    players_data.append(player_data)

                response = {
                    'uuid': str(tournament.uuid),
                    'status': tournament.status,
                    'max_score': tournament.max_score,
                    'created_at': tournament.created_at.isoformat(),
                    'creator': {
                        'uuid': str(tournament.created_by.uuid),
                        'user': {
                            'uuid': str(tournament.created_by.user.uuid),
                            'display_name': tournament.created_by.user.publicuser.display_name,
                            'avatar': get_avatar_url(tournament.created_by.user)
                        }
                    },
                    'players': players_data,
                    'current_match': None,
                }

                if tournament.current_match:
                    response['current_match'] = {
                        'uuid': str(tournament.current_match.uuid),
                        'player_1': {
                            'uuid': str(tournament.current_match.player1.uuid),
                            'user': {
                                'uuid': str(tournament.current_match.player1.user.uuid),
                                'display_name': tournament.current_match.player1.display_name,
                                'avatar': get_avatar_url(tournament.current_match.player1.user)
                            }
                        },
                        'player_2': {
                            'uuid': str(tournament.current_match.player2.uuid),
                            'user': {
                                'uuid': str(tournament.current_match.player2.user.uuid),
                                'display_name': tournament.current_match.player2.display_name,
                                'avatar': get_avatar_url(tournament.current_match.player2.user)
                            }
                        },
                    }

                    tournament.current_match.status = 2
                    await database_sync_to_async(tournament.current_match.save)()

                for player in players:
                    await self.channel_layer.group_send(
                        f"user_{str(player.user.uuid)}",
                        {
                            "type": "send_event",
                            "event_name": "GAME_TOURNAMENT_READY",
                            "data": response
                        }
                    )
                cache.get(f"{tournament.current_match.uuid}_player1_ready", True)
                cache.get(f"{tournament.current_match.uuid}_player2_ready", True)

                await game_manager.start_game(
                    str(tournament.current_match.uuid),
                    str(tournament.current_match.player1.uuid),
                    str(tournament.current_match.player2.uuid),
                    tournament.max_score,
                    self.channel_layer,
                    str(tournament.uuid)
                    )

            elif event == "GAME_TOURNAMENT_WATCH":
                tournament_uuid = data.get('uuid')

                if not tournament_uuid:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Tournament UUID is required.'}
                    }))

                from tournament.models import Tournament

                tournament = await database_sync_to_async(
                    Tournament.objects.filter(uuid=tournament_uuid)
                    .select_related('created_by__user__publicuser',
                                    'current_match')
                                    .first)()

                if not tournament:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'Invalid tournament.'}
                    }))

                players = await database_sync_to_async(
                    lambda: list(tournament.players
                                 .select_related('user__publicuser')
                                 .all()))()

                if self.user not in [player.user for player in players]:
                    return await self.send(text_data=json.dumps({
                        'event': 'ERROR',
                        'data': {'message': 'You are not in this tournament.'}
                    }))

                await self.channel_layer.group_add(f"tournament_{tournament_uuid}", self.channel_name)



                # current_match = tournament.current_match

                # if not current_match:
                #     return await self.send(text_data=json.dumps({
                #         'event': 'ERROR',
                #         'data': {'message': 'No match is currently being played.'}
                #     }))
                # await self.channel_layer.group_add(f"match_{current_match.uuid}", self.channel_name)

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