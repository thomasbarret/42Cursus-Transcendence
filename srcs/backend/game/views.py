from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.db.models import Q
from django.utils import timezone
import random

from .models import Match, MatchPlayer

def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class CreateMatchView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        display_name = request.data.get('display_name')

        if request.user.publicuser.status == 'offline':
            return Response({
                "error": "You are offline",
            }, status=status.HTTP_400_BAD_REQUEST)

        if display_name is None:
            display_name = request.user.publicuser.display_name

        match_player_1, created = MatchPlayer.objects.get_or_create(user=request.user, display_name=display_name)
        match_player_1.save()

        existing_match = Match.objects.filter(Q(player1=match_player_1) | Q(player2=match_player_1), status__in=[1, 2])

        if existing_match.exists():
            match = existing_match.first()
            return Response({
                "uuid": match.uuid,
                "status": match.status,
                "player_1": {
                    "uuid": match.player1.uuid,
                    "display_name": match.player1.display_name,
                    "user": {
                        "uuid": match.player1.user.uuid,
                        "display_name": match.player1.user.publicuser.display_name,
                        "avatar": get_avatar_url(match.player1.user)
                    },
                },
                "player_2": {
                    "uuid": match.player2.uuid,
                    "display_name": match.player2.display_name,
                    "user": {
                        "uuid": match.player2.user.uuid,
                        "display_name": match.player2.user.publicuser.display_name,
                        "avatar": get_avatar_url(match.player2.user)
                    } if match.player2 and match.player2.user else None
                } if match.player2 else None,
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
                    "avatar": get_avatar_url(match.player1.user)
                },
            },
            "player_2": {
                "uuid": match.player2.uuid,
                "display_name": match.player2.display_name,
                "user": {
                    "uuid": match.player2.user.uuid,
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": get_avatar_url(match.player2.user)
                } if match.player2 and match.player2.user else None
            } if match.player2 else None,
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
        })
    def put(self, request, match_uuid):
        if not match_uuid:
            return Response({
                "error": "Match not found",
            }, status=status.HTTP_404_NOT_FOUND)

        winner_uuid = request.data.get('winner_uuid')
        score = request.data.get('score')

        match = Match.objects.get(uuid=match_uuid)

        if match.status != 2:
            return Response({
                "error": "Match is not active",
            }, status=status.HTTP_400_BAD_REQUEST)

        if match.player1.user != request.user and match.player2.user != request.user:
            return Response({
                "error": "You are not in this match",
            }, status=status.HTTP_400_BAD_REQUEST)

        if match.player1.user == request.user:
            match.player1_score = score
        elif match.player2.user == request.user:
            match.player2_score = score

        if winner_uuid:
            winner = MatchPlayer.objects.get(user__uuid=winner_uuid)
            match.winner = winner
            match.status = 3
            match.end_date = timezone.now()
            match.save()

            channel_layer = get_channel_layer()

            response = response = {
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
                        "username": match.player2.user.username,
                        "display_name": match.player2.user.publicuser.display_name,
                        "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                    },
                },
                "player1_score": match.player1_score,
                "player2_score": match.player2_score,
                "winner": {
                    "uuid":  str(match.winner.uuid),
                    "display_name": match.winner.display_name,
                    "user": {
                        "uuid":  str(match.winner.user.uuid),
                        "username": match.winner.user.username,
                        "display_name": match.winner.user.publicuser.display_name,
                        "avatar": match.winner.user.publicuser.avatar.url if match.winner.user.publicuser.avatar else None,
                    },
                } if match.winner else None,
                "max_score": match.max_score,
                "start_date": match.start_date.isoformat() if match.start_date else None,
                "end_date": match.end_date.isoformat() if match.end_date else None,
                "created_at": match.created_at.isoformat(),
                "updated_at": match.updated_at.isoformat(),
            }

            async_to_sync(channel_layer.group_send)(
                f"user_{str(match.player1.user.uuid)}",
                {
                    "type": "send_event",
                    "event_name": "GAME_MATCH_FINISHED",
                    "data": response
                }
            )

            async_to_sync(channel_layer.group_send)(
                f"user_{str(match.player2.user.uuid)}",
                {
                    "type": "send_event",
                    "event_name": "GAME_MATCH_FINISHED",
                    "data": response
                }
            )
            return Response(response)

        match.save()
        return Response({
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
                    "username": match.player2.user.username,
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                },
            },
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": None,
            "max_score": match.max_score,
            "start_date": match.start_date.isoformat() if match.start_date else None,
            "end_date": match.end_date.isoformat() if match.end_date else None,
            "created_at": match.created_at.isoformat(),
            "updated_at": match.updated_at.isoformat(),
        })

class JoinMatchView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
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

        match_player_2, created = MatchPlayer.objects.get_or_create(user=request.user)
        match_player_2.display_name = display_name
        match_player_2.save()

        if match.player1 == match_player_2:
            return Response({
                "error": "You can't join your own match",
            }, status=status.HTTP_400_BAD_REQUEST)

        match.player2 = match_player_2

        match.status = 2
        match.start_time = timezone.now()
        match.save()

        channel_layer = get_channel_layer()

        response = {
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
                    "username": match.player2.user.username,
                    "display_name": match.player2.user.publicuser.display_name,
                    "avatar": match.player2.user.publicuser.avatar.url if match.player2.user.publicuser.avatar else None,
                },
            },
            "player1_score": match.player1_score,
            "player2_score": match.player2_score,
            "winner": None,
            "max_score": match.max_score,
            "start_date": match.start_date.isoformat() if match.start_date else None,
            "end_date": match.end_date.isoformat() if match.end_date else None,
            "created_at": match.created_at.isoformat(),
            "updated_at": match.updated_at.isoformat(),
        }

        async_to_sync(channel_layer.group_send)(
            f"user_{str(match.player1.user.uuid)}",
            {
                "type": "send_event",
                "event_name": "GAME_START_MATCH",
                "data": response
            }
        )
        async_to_sync(channel_layer.group_send)(
            f"user_{str(match_player_2.user.uuid)}",
            {
                "type": "send_event",
                "event_name": "GAME_START_MATCH",
                "data": response
            }
        )

        return Response(response)


