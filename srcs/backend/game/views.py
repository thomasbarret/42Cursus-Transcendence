from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.db.models import Q

from .models import Match, MatchPlayer, balls_direction


class CreateMatchView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        match_player_1, created = MatchPlayer.objects.get_or_create(user=request.user)

        if match_player_1.display_name is None:
            match_player_1.display_name = request.user.publicuser.display_name
        match_player_1.save()

        existing_match = Match.objects.filter(Q(player1=match_player_1) | Q(player2=match_player_1), status__in=[1, 2])

        if existing_match.exists():
            return Response({
                "uuid": existing_match.first().uuid,
                "status": existing_match.first().status,
                "player_1": existing_match.first().player1 if {
                    "uuid": existing_match.first().player1.uuid,
                    "display_name": existing_match.first().player1.display_name,
                    "user": {
                        "uuid": existing_match.first().player1.user.uuid,
                        "display_name": existing_match().player1.user.publicuser.display_name if existing_match().player1.user.publicuser else None,
                        "avatar": existing_match().player1.user.publicuser.avatar.url if existing_match().player1.user.publicuser.avatar else None,
                    },
                } else None,
                "player_2": existing_match.first().player2 if {
                    "uuid": existing_match.first().player2.uuid,
                    "display_name": existing_match.first().player2.display_name,
                    "user": {
                        "uuid": existing_match.first().player2.user.uuid,
                        "display_name": existing_match().player2.user.publicuser.display_name,
                        "avatar": existing_match().player2.user.publicuser.avatar.url if existing_match().player2.user.publicuser.avatar else None,
                    },
                } else None,
                "player1_score": existing_match.first().player1_score,
                "player2_score": existing_match.first().player2_score,
                "winner": existing_match.first().winner if {
                    "uuid": existing_match.first().winner.uuid,
                    "display_name": existing_match.first().winner.display_name,
                    "user": {
                        "uuid": existing_match.first().winner.user.uuid,
                        "display_name": existing_match().winner.user.publicuser.display_name,
                        "avatar": existing_match().winner.user.publicuser.avatar.url if existing_match().winner.user.publicuser.avatar else None,
                    },
                } else None,
                "max_score": existing_match.first().max_score,
                "start_date": existing_match.first().start_date,
                "end_date": existing_match.first().end_date,
                "created_at": existing_match.first().created_at,
                "updated_at": existing_match.first().updated_at,
            })

        match = Match.objects.create(
            status=1,
            player1=match_player_1,
            player1_score=0,
            player2_score=0,
            max_score=5,
        )

        match.save()

        return Response({
            "uuid": match.uuid,
            "status": match.status,
            "player_1": {
                "uuid": match.player1.uuid,
                "display_name": match.player1.display_name,
                "user": {
                    "uuid": match.player1.user.uuid,
                    "display_name": match.player1.user.publicuser.display_name,
                    "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                },
            },
            "player_2": None,
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": None,
            "max_score": match.max_score,
            "start_date": match.start_date,
            "end_date": match.end_date,
            "created_at": match.created_at,
            "updated_at": match.updated_at,
        })

class GetMatchView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, match_uuid):
        if not match_uuid:
            return Response({
                "error": "Match not found",
            }, status=status.HTTP_404_NOT_FOUND)
        match = Match.objects.get(uuid=match_uuid)

        return Response({
            "uuid": match.uuid,
            "status": match.status,
            "player_1": {
                "uuid": match.player1.uuid,
                "display_name": match.player1.display_name,
                "user": {
                    "uuid": match.player1.user.uuid,
                    "display_name": match.player1.user.publicuser.display_name,
                    "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                },
            },
            "player_2": match.player2 if {
                "uuid": match.player2.uuid,
                "display_name": match.player2.display_name,
                "user": {
                    "uuid": match.player2.user.uuid,
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                },
            } else None,
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": match.winner if {
                "uuid": match.winner.uuid,
                "display_name": match.winner.display_name,
                "user": {
                    "uuid": match.winner.user.uuid,
                    "display_name": match.winner.user.publicuser.display_name,
                    "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                },
            } else None,
            "max_score": match.max_score,
            "start_date": match.start_date,
            "end_date": match.end_date,
            "created_at": match.created_at,
            "updated_at": match.updated_at,
        })

class JoinMatchView(APIView):
    def post(self):
        match_uuid = request.data.get('match_uuid')
        display_name = request.data.get('display_name')

        if not match_uuid:
            return Response({
                "error": "Match not found",
            }, status=status.HTTP_404_NOT_FOUND)

        if display_name is None:
            display_name = request.user.publicuser.display_name

        match = Match.objects.get(uuid=match_uuid)

        if match.status != 1:
            return Response({
                "error": "Match is not available",
            }, status=status.HTTP_400_BAD_REQUEST)

        match_player_2 = MatchPlayer.objects.get_or_create(user=request.user)
        match_player_2.display_name = display_name
        match_player_2.save()

        match.player2 = match_player_2

        match.status = 2
        match.start_time = timezone.now()
        match.save()

        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"user_{str(match_player_1.user.uuid)}",
            {
                "type": "send_event",
                "event_name": "GAME_START_MATCH",
                "data": {
                    "uuid": match.uuid,
                    "status": match.status,
                    "game": {
                        "ball_direction": random.choice(balls_direction),
                    },
                    "player_1": {
                        "uuid": match.player1.uuid,
                        "display_name": match.player1.display_name,
                        "user": {
                            "uuid": match.player1.user.uuid,
                            "display_name": match.player1.user.publicuser.display_name,
                            "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                        },
                    },
                    "player_2": {
                        "uuid": match.player2.uuid,
                        "display_name": match.player2.display_name,
                        "user": {
                            "uuid": match.player2.user.uuid,
                            "display_name": match.player2.user.publicuser.display_name,
                            "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                        },
                    },
                    "player1_score": match.player1_score,
                    "player2_score": match.player2_score,
                    "winner": match.winner if {
                        "uuid": match.winner.uuid,
                        "display_name": match.winner.display_name,
                        "user": {
                            "uuid": match.winner.user.uuid,
                            "display_name": match.winner.user.publicuser.display_name,
                            "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                        },
                    } else None,
                    "max_score": match.max_score,
                    "start_date": match.start_date,
                    "end_date": match.end_date,
                    "created_at": match.created_at,
                    "updated_at": match.updated_at,
                }
            }
        )
        async_to_sync(channel_layer.group_send)(
            f"user_{str(match_player_2.user.uuid)}",
            {
                "type": "send_event",
                "event_name": "GAME_START_MATCH",
                "data": {
                    "uuid": match.uuid,
                    "status": match.status,
                    "game": {
                        "ball_direction": random.choice(balls_direction),
                    },
                    "player_1": {
                        "uuid": match.player1.uuid,
                        "display_name": match.player1.display_name,
                        "user": {
                            "uuid": match.player1.user.uuid,
                            "display_name": match.player1.user.publicuser.display_name,
                            "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                        },
                    },
                    "player_2": {
                        "uuid": match.player2.uuid,
                        "display_name": match.player2.display_name,
                        "user": {
                            "uuid": match.player2.user.uuid,
                            "display_name": match.player2.user.publicuser.display_name,
                            "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                        },
                    },
                    "player1_score": match.player1_score,
                    "player2_score": match.player2_score,
                    "winner": match.winner if {
                        "uuid": match.winner.uuid,
                        "display_name": match.winner.display_name,
                        "user": {
                            "uuid": match.winner.user.uuid,
                            "display_name": match.winner.user.publicuser.display_name,
                            "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                        },
                    } else None,
                    "max_score": match.max_score,
                    "start_date": match.start_date,
                    "end_date": match.end_date,
                    "created_at": match.created_at,
                    "updated_at": match.updated_at,
                }
            }
        )

        return Response({
            "uuid": match.uuid,
            "status": match.status,
            "player_1": {
                "uuid": match.player1.uuid,
                "display_name": match.player1.display_name,
                "user": {
                    "uuid": match.player1.user.uuid,
                    "display_name": match.player1.user.publicuser.display_name,
                    "avatar": match.player1.user.publicuser.avatar.url if match.player1.user.publicuser.avatar else None,
                },
            },
            "player_2": {
                "uuid": match.player2.uuid,
                "display_name": match.player2.display_name,
                "user": {
                    "uuid": match.player2.user.uuid,
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                },
            },
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": match.winner if {
                "uuid": match.winner.uuid,
                "display_name": match.winner.display_name,
                "user": {
                    "uuid": match.winner.user.uuid,
                    "display_name": match.winner.user.publicuser.display_name,
                    "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                },
            } else None,
            "max_score": match.max_score,
            "start_date": match.start_date,
            "end_date": match.end_date,
            "created_at": match.created_at,
            "updated_at": match.updated_at,
        })




