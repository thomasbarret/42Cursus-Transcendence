from django.shortcuts import render
from .models import Tournament
from game.models import Match, MatchPlayer

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status
from chat.models import Channel

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.shortcuts import get_object_or_404


from django.db.models import Q

def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class CreateTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(seft, request):
        try:
            creator_player, created = MatchPlayer.objects.get_or_create(
                user=request.user,
                defaults={'display_name': request.user.publicuser.display_name}
            )

            tournament = Tournament.objects.create(
                status=1,
                channel=Channel.objects.create(
                    type=2
                ),
                created_by=creator_player
            )

            tournament.players.add(creator_player)
            tournament.channel.users.add(request.user)
            tournament.save()

            return Response({
                'uuid': tournament.uuid,
                'channel': {
                    'uuid': tournament.channel.uuid,
                    'type': tournament.channel.type,
                    'created_at': tournament.channel.created_at,
                },
                'created_at': tournament.created_at,
            })
        except:
            return Response({
                'error': 'Failed to create tournament'
            }, status=status.HTTP_400_BAD_REQUEST)


class GetTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, tournament_uuid):
        try:
            tournament = get_object_or_404(Tournament, uuid=tournament_uuid)

            if not tournament:
                return Response({
                    'error': 'Tournament not found'
                }, status=status.HTTP_404_NOT_FOUND)

            creator = tournament.created_by

            players = tournament.players.all()
            players_data = []
            for player in players:
                player_data = {
                    'uuid': player.uuid,
                    'user': {
                        'uuid': player.user.uuid,
                        'display_name': player.user.publicuser.display_name,
                        'avatar': get_avatar_url(player.user)
                    }
                }
                players_data.append(player_data)

            current_match = tournament.current_match

            return Response({
                'uuid': tournament.uuid,
                'max_score': tournament.max_score,
                'status': tournament.status,
                'channel': {
                    'uuid': tournament.channel.uuid,
                    'type': tournament.channel.type,
                    'created_at': tournament.channel.created_at,
                },
                'creator': {
                    'uuid': creator.uuid,
                    'user': {
                        'uuid': creator.user.uuid,
                        'display_name': creator.user.publicuser.display_name,
                        'avatar': get_avatar_url(creator.user)
                    }
                },
                'winner' : {
                    "uuid": str(tournament.winner.uuid),
                    "display_name": tournament.winner.display_name,
                    "user": {
                        "uuid": str(tournament.winner.user.uuid),
                        "display_name": tournament.winner.user.publicuser.display_name,
                        "avatar": get_avatar_url(tournament.winner.user)
                    },

                } if tournament.winner else None,
                'players': players_data,
                'current_match': {
                    "uuid": str(current_match.uuid),
                    "status": current_match.status,
                    "player_1": {
                        "uuid": current_match.player1.uuid,
                        "display_name": current_match.player1.display_name,
                        "user": {
                            "uuid": current_match.player1.user.uuid,
                            "display_name": current_match.player1.user.publicuser.display_name,
                            "avatar": get_avatar_url(current_match.player1.user)
                        },
                    },
                    "player_2": {
                        "uuid": current_match.player2.uuid,
                        "display_name": current_match.player2.display_name,
                        "user": {
                            "uuid": current_match.player2.user.uuid,
                            "display_name": current_match.player2.user.publicuser.display_name,
                            "avatar": get_avatar_url(current_match.player2.user)
                        } if current_match.player2 and current_match.player2.user else None
                    } if current_match.player2 else None,
                    "player1_score": current_match.player1_score,
                    "player2_score": current_match.player2_score,
                    "winner": {
                        "uuid": current_match.winner.uuid,
                        "display_name": current_match.winner.display_name,
                        "user": {
                            "uuid": current_match.winner.user.uuid,
                            "display_name": current_match.winner.user.publicuser.display_name,
                            "avatar": current_match.winner.user.publicuser.avatar.url if current_match.winner.user.publicuser.avatar else None,
                        },
                    } if current_match.winner else None,
                    "max_score": current_match.max_score,
                    "start_date": current_match.start_date,
                    "end_date": current_match.end_date,
                    "created_at": current_match.created_at,
                    "updated_at": current_match.updated_at,
                } if tournament.current_match else None,
                'matches': [{
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
                } for match in tournament.matches.all()],
                'created_at': tournament.created_at,
            })
        except Tournament.DoesNotExist:
            return Response({
                'error': 'Tournament not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except:
            return Response({
                'error': 'Failed to get tournament'
            }, status=status.HTTP_400_BAD_REQUEST)

class JoinTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            tournament_uuid = request.data.get('uuid')

            if not tournament_uuid:
                return Response({
                    'error': 'Tournament UUID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                tournament = get_object_or_404(Tournament, uuid=tournament_uuid)
            except:
                return Response({
                    'error': 'Invalid tournament UUID'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not tournament:
                return Response({
                    'error': 'Tournament not found'
                }, status=status.HTTP_404_NOT_FOUND)

            creator = tournament.created_by

            if tournament.status != 1:
                return Response({
                    'error': 'This tournament is not open for registration'
                }, status=status.HTTP_400_BAD_REQUEST)

            player, created = MatchPlayer.objects.get_or_create(
                user=request.user,
                defaults={'display_name': request.user.publicuser.display_name}
            )

            players = tournament.players.all()

            if created or player not in players:
                tournament.players.add(player)

            tournament.channel.users.add(request.user)
            tournament.save()


            def get_response():
                players = tournament.players.all()

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

                return {
                    'uuid': str(tournament.uuid),
                    'status': tournament.status,
                    'max_score': tournament.max_score,
                    'channel': {
                        'uuid': str(tournament.channel.uuid),
                        'type': tournament.channel.type,
                        'created_at': tournament.channel.created_at.isoformat(),
                    },
                    'creator': {
                        'uuid': str(creator.uuid),
                        'user': {
                            'uuid': str(creator.user.uuid),
                            'display_name': creator.user.publicuser.display_name,
                            'avatar': get_avatar_url(creator.user)
                        }
                    },
                    'players': players_data,
                    'current_match': None,
                    'created_at': tournament.created_at.isoformat(),
                }

            channel_layer = get_channel_layer()
            for player in players:
                async_to_sync(channel_layer.group_send)(
                    f"user_{str(player.user.uuid)}",
                    {
                        "type": "send_event",
                        "event_name": "TOURNAMENT_PLAYER_JOIN",
                        "data": get_response()
                    }
                )

            return Response(get_response())
        except:
            return Response({
                'error': 'Failed to join tournament'
            }, status=status.HTTP_400_BAD_REQUEST)
