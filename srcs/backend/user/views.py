from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from authentication.models import PublicUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import UserRelation
from game.models import Match, MatchPlayer
from tournament.models import Tournament
from django.db.models import Q

def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class ProfilView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_public_user(self, user_uuid=None):
        if user_uuid is None or user_uuid == '@me':
            if self.request.user.is_authenticated:
                return self.request.user.publicuser
            else:
                return None
        return get_object_or_404(PublicUser, user__uuid=user_uuid)

    def get(self, request, user_uuid=None):
        public_user = self.get_public_user(user_uuid)
        if public_user is None:
            return Response({"error": "Authentication required for '@me'"}, status=status.HTTP_401_UNAUTHORIZED)

        player = MatchPlayer.objects.filter(user=public_user.user).first()

        match_wins = 0
        match_loses = 0
        match_count = 0

        if player is not None:
            match_wins = Match.objects.filter(winner=player).count()
            match_loses = Match.objects.filter(
                (Q(player1=player, winner=None) | Q(player2=player, winner=None)) & ~Q(winner=player, status__in=[3])
            ).count()
            match_count = Match.objects.filter(
                (Q(player1=player) | Q(player2=player)) & Q(status__in=[3])
            ).count()

        if user_uuid is None:
            return JsonResponse({
                'uuid': public_user.user.uuid,
                'username': public_user.user.username,
                'display_name': public_user.display_name,
                'avatar': get_avatar_url(public_user.user),
                'status': public_user.status,

                'match_wins': match_wins,
                'match_loses': match_loses,
                'match_count': match_count,
            })


        is_blocked = UserRelation.objects.filter(
            Q(user_1=request.user, user_2=public_user.user, type=2) | Q(user_1=public_user.user, user_2=request.user, type=2)
        ).exists()

        is_friend = UserRelation.objects.filter(
            Q(user_1=request.user, user_2=public_user.user, type=1, status=2) | Q(user_1=public_user.user, user_2=request.user, type=1, status=2)
        ).exists()

        friend_request_sent = UserRelation.objects.filter(
            user_1=request.user, user_2=public_user.user, type=1, status=1
        ).exists()



        return JsonResponse({
            'uuid': public_user.user.uuid,
            'display_name': public_user.display_name,
            'username': public_user.user.username,
            'avatar': get_avatar_url(public_user.user),
            'status': public_user.status,

            'is_blocked': is_blocked,
            'is_friend': is_friend,
            'friend_request_sent': friend_request_sent,

            'match_wins': match_wins,
            'match_loses': match_loses,
            'match_count': match_count,
        })

    def post(self, request, user_uuid=None):
        public_user = self.get_public_user(user_uuid)

        if (user_uuid is None or user_uuid == '@me') and not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        if user_uuid and user_uuid != '@me' and request.user.uuid != user_uuid:
            return Response({"error": "You can only update your own profile"}, status=status.HTTP_403_FORBIDDEN)

        if 'display_name' in request.data:
            if len(request.data['display_name']) > 150:
                return Response({"error": "Display name is too long"}, status=status.HTTP_400_BAD_REQUEST)
            public_user.display_name = request.data['display_name']

        # TODO this is not developed yet
        if 'avatar' in request.data:
            public_user.avatar = request.data['avatar']

        public_user.save()

        return Response({
            'display_name': public_user.display_name,
            'avatar': get_avatar_url(public_user.user),
        }, status=status.HTTP_200_OK)

class SearchUserView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query')
        if query is None:
            return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

        users = PublicUser.objects.filter(
            Q(display_name__icontains=query) | Q(user__username__icontains=query)
        ).exclude(user=request.user)

        return JsonResponse({
            'users': [{
                'uuid': user.user.uuid,
                'username': user.user.username,
                'display_name': user.display_name,
                'avatar': get_avatar_url(user.user),
            } for user in users]
        })

class RelationView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friends_send = UserRelation.objects.filter(
            author=request.user,
            type=1,
            status=1
        )

        friends_receive = UserRelation.objects.filter(
            Q(user_1=request.user) | Q(user_2=request.user),
            type=1,
            status=1
        ).exclude(author=request.user)  # Utiliser exclude ici

        friends = UserRelation.objects.filter(
            Q(user_1=request.user) | Q(user_2=request.user),
            type=1,
            status=2
        )

        blocked = UserRelation.objects.filter(
            Q(user_1=request.user) | Q(user_2=request.user),
            type=2,
            author=request.user
        )

        return JsonResponse({
            'friends': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': get_avatar_url(relation.user_1) if relation.user_1 != request.user else get_avatar_url(relation.user_2),
                }
            } for relation in friends],
            'blocked': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': get_avatar_url(relation.user_1) if relation.user_1 != request.user else get_avatar_url(relation.user_2),
                }
            } for relation in blocked],
            'send': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': get_avatar_url(relation.user_1) if relation.user_1 != request.user else get_avatar_url(relation.user_2),
                }
            } for relation in friends_send],
            'receive': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': get_avatar_url(relation.user_1) if relation.user_1 != request.user else get_avatar_url(relation.user_2),
                }
            } for relation in friends_receive],
        })
    def post(self, request):
        user_2_username = request.data.get('username')
        type = request.data.get('type')
        if user_2_username is None:
            return Response({"error": "User username is required"}, status=status.HTTP_400_BAD_REQUEST)

        user_2 = get_object_or_404(PublicUser, user__username=user_2_username)

        if user_2.user == request.user:
            return Response({"error": "You can't send a friend request to yourself"}, status=status.HTTP_400_BAD_REQUEST)

        if type is None:
            return Response({"error": "Type is required"}, status=status.HTTP_400_BAD_REQUEST)

        if type == 2:
            relation_already_exists = UserRelation.objects.filter(
                Q(user_1=request.user, user_2=user_2.user) | Q(user_1=user_2.user, user_2=request.user),
            ).first()
            if relation_already_exists is not None:
                relation_already_exists.type = 2
                relation_already_exists.status = 2
                relation_already_exists.save()
                return Response({"message": "User blocked"}, status=status.HTTP_200_OK)
            relation = UserRelation.objects.create(
                author=request.user,
                user_1=request.user,
                user_2=user_2.user,
                type=2,
                status=2
            )

            return Response({"message": "User blocked"}, status=status.HTTP_200_OK)

        relation_already_exists = UserRelation.objects.filter(
            Q(user_1=request.user, user_2=user_2.user) | Q(user_1=user_2.user, user_2=request.user),
        ).first()



        if relation_already_exists is not None and (relation_already_exists.type == 1 and relation_already_exists.status == 1)\
                and relation_already_exists.author != request.user:
            relation_already_exists.status = 2
            relation_already_exists.save()

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{str(user_2.user.uuid)}",
                {
                    "type": "send_event",
                    "event_name": "FRIEND_REQUEST_ACCEPT",
                    "data": {
                        "uuid": str(relation_already_exists.uuid),
                        "type": relation_already_exists.type,
                        "status": relation_already_exists.status,
                        "author": {
                            "uuid": str(request.user.uuid),
                            "display_name": request.user.publicuser.display_name,
                            "username": request.user.username,
                            "avatar": get_avatar_url(request.user),
                        }
                    }
                }
            )
            return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)

        relation, created = UserRelation.objects.get_or_create(
            author=request.user,
            user_1=request.user,
            user_2=user_2.user,
            defaults={'type': 1, 'status': 1}
        )
        if not created and relation.type == 1 and relation.status == 1:
            return Response({"error": "Friend request already sent"}, status=status.HTTP_400_BAD_REQUEST)

        relation.status = 1
        relation.type = 1
        relation.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{str(user_2.user.uuid)}",
            {
                "type": "send_event",
                "event_name": "FRIEND_REQUEST_CREATE",
                "data": {
                    "uuid": str(relation.uuid),
                    "type": relation.type,
                    "status": relation.status,
                    "author": {
                        "uuid": str(request.user.uuid),
                        "display_name": request.user.publicuser.display_name,
                        "username": request.user.username,
                        "avatar": get_avatar_url(request.user),
                    }
                }
            }
        )
        return Response({"message": "Friend request sent"}, status=status.HTTP_200_OK)

    def put(self, request):
        relation_uuid = request.data.get('uuid')
        relation_status = request.data.get('status')  # Renommer pour éviter le conflit

        if relation_uuid is None:
            return Response({"error": "Relation UUID is required"}, status=status.HTTP_400_BAD_REQUEST)

        if relation_status is None:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            relation = UserRelation.objects.get(uuid=relation_uuid)
        except UserRelation.DoesNotExist:
            return Response({"error": "Relation not found"}, status=status.HTTP_404_NOT_FOUND)
        except:
            return Response({"error": "Invalid UUID"}, status=status.HTTP_400_BAD_REQUEST)

        if relation.user_1 != request.user and relation.user_2 != request.user:
            return Response({"error": "You can only update your own relations"}, status=status.HTTP_403_FORBIDDEN)
        if relation.author == request.user:
            return Response({"error": "You can't update your own relation"}, status=status.HTTP_400_BAD_REQUEST)
        if relation.status != 1:
            return Response({"error": "Relation is not pending"}, status=status.HTTP_400_BAD_REQUEST)

        if relation_status == 2:  # Utiliser la variable renommée
            relation.status = 2
            relation.save()

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notification_{str(relation.author.uuid)}",
                {
                    "type": "send_event",
                    "event_name": "FRIEND_REQUEST_ACCEPT",
                    "data": {
                        "uuid": relation.uuid,
                        "type": relation.type,
                        "status": relation.status,
                        "author": {
                            "uuid": str(request.user.uuid),
                            "display_name": request.user.publicuser.display_name,
                            "username": request.user.username,
                            "avatar": get_avatar_url(request.user),
                        }
                    }
                }
            )

        return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)

    def delete(self, request):
        relation_uuid = request.data.get('uuid')
        if relation_uuid is None:
            return Response({"error": "Relation UUID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            relation = UserRelation.objects.get(uuid=relation_uuid)
        except UserRelation.DoesNotExist:
            return Response({"error": "Relation not found"}, status=status.HTTP_404_NOT_FOUND)
        except:
            return Response({"error": "Invalid UUID"}, status=status.HTTP_400_BAD_REQUEST)
        if relation.status != 2 and relation.author != request.user:
            return Response({"error": "You can delete only accepted relations"}, status=status.HTTP_400_BAD_REQUEST)
        if relation.user_1 != request.user and relation.user_2 != request.user:
            return Response({"error": "You can only delete your own relations"}, status=status.HTTP_403_FORBIDDEN)
        relation.delete()
        return Response({"message": "Relation deleted"}, status=status.HTTP_200_OK)

class ProfilMatchView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get_public_user(self, user_uuid=None):
        if user_uuid is None or user_uuid == '@me':
            if self.request.user.is_authenticated:
                return self.request.user.publicuser
            else:
                return None
        return get_object_or_404(PublicUser, user__uuid=user_uuid)

    def get(self, request, user_uuid=None):
        public_user = self.get_public_user(user_uuid)

        if public_user is None:
            return Response({"error": "Authentication required for '@me'"}, status=status.HTTP_401_UNAUTHORIZED)

        user = public_user.user
        player = MatchPlayer.objects.filter(user=user).first()

        if player is None:
            return JsonResponse({'matches': []})

        matches = Match.objects.filter(
            Q(player1=player) | Q(player2=player)
        ).order_by('start_date')

        return JsonResponse({
            'matches': [{
                'uuid': match.uuid,
                'tournament': None,
                'player1': {
                    'uuid': match.player1.user.uuid,
                    'user': {
                        'uuid': match.player1.user.uuid,
                        'username': match.player1.user.username,
                        'display_name': match.player1.display_name,
                        'avatar': get_avatar_url(match.player1.user),
                    }
                },
                'player2': {
                    'uuid': match.player2.user.uuid,
                    'user': {
                        'uuid': match.player2.user.uuid,
                        'username': match.player2.user.username,
                        'display_name': match.player2.display_name,
                        'avatar': get_avatar_url(match.player2.user),
                    }
                } if match.player2 is not None else None,
                'player1_score': match.player1_score,
                'player2_score': match.player2_score,
                'winner': {
                    'uuid': match.winner.user.uuid,
                    'username': match.winner.user.username,
                    'display_name': match.winner.display_name,
                    'avatar': get_avatar_url(match.winner.user),
                } if match.winner is not None else None,
                'status': match.status,
                'start_date': match.start_date,
                'end_date': match.end_date,
            } for match in matches]
        })

class ProfilTournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get_public_user(self, user_uuid=None):
        if user_uuid is None or user_uuid == '@me':
            if self.request.user.is_authenticated:
                return self.request.user.publicuser
            else:
                return None
        return get_object_or_404(PublicUser, user__uuid=user_uuid)

    def get(self, request, user_uuid=None):
        public_user = self.get_public_user(user_uuid)

        if public_user is None:
            return Response({"error": "Authentication required for '@me'"}, status=status.HTTP_401_UNAUTHORIZED)

        user = public_user.user
        player = MatchPlayer.objects.filter(user=user).first()

        if player is None:
            return JsonResponse({'tournaments': []})

        tournaments = Tournament.objects.filter(
            players=player
        ).order_by('start_date')

        return JsonResponse({
            'tournaments': [
                {
                    'uuid': str(tournament.uuid),
                    'max_score': tournament.max_score,
                    'status': tournament.status,
                    'channel': {
                        'uuid': str(tournament.channel.uuid),
                        'type': tournament.channel.type,
                        'created_at': tournament.channel.created_at.isoformat(),
                    },
                    'creator': {
                        'uuid': str(tournament.created_by.uuid),
                        'user': {
                            'uuid': str(tournament.created_by.uuid),
                            'display_name': tournament.created_by.user.publicuser.display_name,
                            'avatar': get_avatar_url(tournament.created_by.user),
                        }
                    },
                    'winner': {
                        'uuid': tournament.winner.user.uuid,
                        'username': tournament.winner.user.username,
                        'display_name': tournament.winner.display_name,
                        'avatar': get_avatar_url(tournament.winner.user),
                    } if tournament.winner is not None else None,
                    'players': [
                        {
                            'uuid': str(player.uuid),
                            'user': {
                                'uuid': str(player.user.uuid),
                                'display_name': player.user.publicuser.display_name,
                                'avatar': get_avatar_url(player.user)
                            }
                        } for player in tournament.players.all()
                    ],
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
                        "max_score": tournament.max_score,
                        "start_date": tournament.start_date.isoformat() if tournament.start_date else None,
                        "end_date": tournament.end_date.isoformat() if tournament.end_date else None,
                        "created_at": tournament.created_at.isoformat(),
                        "updated_at": tournament.updated_at.isoformat() if tournament.updated_at else None,
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
                    'created_at': tournament.created_at.isoformat(),
                } for tournament in tournaments],
        })

