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

from django.db.models import Q

def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class CreateTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(seft, request):
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


class GetTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, tournament_uuid):
        try:
            tournament = Tournament.objects.get(uuid=tournament_uuid)

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

            match = tournament.current_match
            return Response({
                'uuid': tournament.uuid,
                'max_score': tournament.max_score,
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
                'players': players_data,
                'current_match': {
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
                } if tournament.current_match else None,
                'created_at': tournament.created_at,
            })
        except Tournament.DoesNotExist:
            return Response({
                'error': 'Tournament not found'
            }, status=status.HTTP_404_NOT_FOUND)

class JoinTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):

        tournament_uuid = request.data.get('uuid')
        tournament = Tournament.objects.get(uuid=tournament_uuid)

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
        players_data = []

        if created or player not in players:
            tournament.players.add(player)

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

        return Response({
            'uuid': tournament.uuid,
            'max_score': tournament.max_score,
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
            'players': players_data,
            'current_match': None,
            'created_at': tournament.created_at,
        })

# class StartTournamentView(APIView):
#     authentication_classes = [TokenFromCookieAuthentication]
#     permission_classes = [IsAuthenticated]
#
#     def post(self, request, tournament_uuid):
#         tournament = Tournament.objects.get(uuid=tournament_uuid)
#
#         creator = tournament.created_by.user
#
#         creator_player = MatchPlayer.objects.get(user=creator)
#
#         if tournament.status != 1:
#             return Response({
#                 'error': 'This tournament is not open for registration'
#             }, status=status.HTTP_400_BAD_REQUEST)
#
#         if tournament.players.count() < 2:
#             return Response({
#                 'error': 'This tournament needs at least 2 players to start'
#             }, status=status.HTTP_400_BAD_REQUEST)
#
#         tournament.create_all_matches()
#
#         tournament.status = 2
#         tournament.save()
#
#         players = tournament.players.all()
#
#         players_data = []
#
#         channel_layer = get_channel_layer()
#
#         for player in players:
#             player_data = {
#                 'uuid': player.user.publicuser.uuid,
#                 'user': {
#                     'uuid': player.user.publicuser.uuid,
#                     'display_name': player.display_name,
#                     'avatar': get_avatar_url(player.user)
#                 }
#             }
#             players_data.append(player_data)
#
#         response = {
#             'uuid': tournament.uuid,
#             'max_score': tournament.max_score,
#             'created_at': tournament.created_at,
#             'creator': {
#                 'uuid': creator_player.uuid,
#                 'user': {
#                     'uuid': creator.publicuser.uuid,
#                     'display_name': creator.publicuser.display_name,
#                     'avatar': get_avatar_url(creator)
#                 }
#             },
#             'players': players_data,
#             'current_match': {
#                 'uuid': tournament.current_match.uuid,
#                 'player1': {
#                     'uuid': tournament.current_match.player1.user.publicuser.uuid,
#                     'display_name': tournament.current_match.player1.display_name,
#                     'avatar': get_avatar_url(tournament.current_match.player1.user)
#                 },
#                 'player2': {
#                     'uuid': tournament.current_match.player2.user.publicuser.uuid,
#                     'display_name': tournament.current_match.player2.display_name,
#                     'avatar': get_avatar_url(tournament.current_match.player2.user)
#                 },
#             } if tournament.current_match else None,
#         }
#
#         for player in players:
#             async_to_sync(channel_layer.group_send)(
#                 f"user_{str(player.user.uuid)}",
#                 {
#                     "type": "send_event",
#                     "event_name": "TOURNAMENT_START",
#                     "data": response
#                 }
#             )
#
#         return JsonResponse(response)

