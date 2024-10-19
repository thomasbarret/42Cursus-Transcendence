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
from django.db.models import Q


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

        return JsonResponse({
            'uuid': public_user.user.uuid,
            'display_name': public_user.display_name,
            'avatar': public_user.avatar.url if public_user.avatar else None,
            'status': public_user.status,
        })

    def post(self, request, user_uuid=None):
        public_user = self.get_public_user(user_uuid)

        if (user_uuid is None or user_uuid == '@me') and not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        if user_uuid and user_uuid != '@me' and request.user.uuid != user_uuid:
            return Response({"error": "You can only update your own profile"}, status=status.HTTP_403_FORBIDDEN)

        if 'display_name' in request.data:
            public_user.display_name = request.data['display_name']

        # TODO this is not developed yet
        # if 'avatar' in request.FILES:
        #     public_user.avatar = request.FILES['avatar']

        public_user.save()

        return Response({
            'display_name': public_user.display_name,
            'avatar': public_user.avatar.url if public_user.avatar else None,
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
                'avatar': user.avatar.url if user.avatar else None,
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
                    'avatar': (relation.user_1.publicuser.avatar.url if relation.user_1 != request.user and relation.user_1.publicuser.avatar else relation.user_2.publicuser.avatar.url) if relation.user_1 != request.user else (relation.user_2.publicuser.avatar.url if relation.user_2.publicuser.avatar else None),
                }
            } for relation in friends],
            'blocked': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': (relation.user_1.publicuser.avatar.url if relation.user_1 != request.user and relation.user_1.publicuser.avatar else relation.user_2.publicuser.avatar.url) if relation.user_1 != request.user else (relation.user_2.publicuser.avatar.url if relation.user_2.publicuser.avatar else None),
                }
            } for relation in blocked],
            'send': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': (relation.user_1.publicuser.avatar.url if relation.user_1 != request.user and relation.user_1.publicuser.avatar else relation.user_2.publicuser.avatar.url) if relation.user_1 != request.user else (relation.user_2.publicuser.avatar.url if relation.user_2.publicuser.avatar else None),
                }
            } for relation in friends_send],
            'receive': [{
                'uuid': relation.uuid,
                'user': {
                    'uuid': relation.user_1.uuid if relation.user_1 != request.user else relation.user_2.uuid,
                    'username': relation.user_1.username if relation.user_1 != request.user else relation.user_2.username,
                    'display_name': relation.user_1.publicuser.display_name if relation.user_1 != request.user else relation.user_2.publicuser.display_name,
                    'avatar': (relation.user_1.publicuser.avatar.url if relation.user_1 != request.user and relation.user_1.publicuser.avatar else relation.user_2.publicuser.avatar.url) if relation.user_1 != request.user else (relation.user_2.publicuser.avatar.url if relation.user_2.publicuser.avatar else None),
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
                f"notification_{user_2.user.uuid}",
                {
                    "type": "send_event",
                    "event_name": "FRIEND_REQUEST_ACCEPT",
                    "data": {
                        "uuid": relation_already_exists.uuid,
                        "type": relation_already_exists.type,
                        "status": relation_already_exists.status,
                        "author": {
                            "uuid": str(request.user.uuid),
                            "display_name": request.user.publicuser.display_name,
                            "username": request.user.username,
                            "avatar": request.user.publicuser.avatar.url if request.user.publicuser.avatar else None,
                        }
                    }
                }
            )
            return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)




        relation, created = UserRelation.objects.get_or_create(
            author=request.user,
            user_1=request.user,
            user_2=user_2.user,
        )

        if not created and relation.type == 1 and relation.status == 1:
            return Response({"error": "Friend request already sent"}, status=status.HTTP_400_BAD_REQUEST)

        relation.status = 1
        relation.type = 1
        relation.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notification_{user_2.user.uuid}",
            {
                "type": "send_event",
                "event_name": "FRIEND_REQUEST_CREATE",
                "data": {
                    "uuid": relation.uuid,
                    "type": relation.type,
                    "status": relation.status,
                    "author": {
                        "uuid": str(request.user.uuid),
                        "display_name": request.user.publicuser.display_name,
                        "username": request.user.username,
                        "avatar": request.user.publicuser.avatar.url if request.user.publicuser.avatar else None,
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
                f"notification_{relation.author.uuid}",
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
                            "avatar": request.user.publicuser.avatar.url if request.user.publicuser.avatar else None,
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
        if relation.status != 2:
            return Response({"error": "You can delete only accepted relations"}, status=status.HTTP_400_BAD_REQUEST)
        if relation.user_1 != request.user and relation.user_2 != request.user:
            return Response({"error": "You can only delete your own relations"}, status=status.HTTP_403_FORBIDDEN)
        relation.delete()
        return Response({"message": "Relation deleted"}, status=status.HTTP_200_OK)


