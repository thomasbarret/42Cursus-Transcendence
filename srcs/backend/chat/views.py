from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status

from .models import Channel, Message
from authentication.models import User

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from user.models import UserRelation
from django.db.models import Q


class ChannelView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, channel_uuid=None):
        if channel_uuid is None:
            return Response({"error": "Channel UUID is required"}, status=status.HTTP_400_BAD_REQUEST)

        channel = Channel.objects.filter(uuid=channel_uuid, users=request.user)
        if not channel.exists():
            return Response({"error": "Channel not found"}, status=status.HTTP_404_NOT_FOUND)

        channel = channel.first()
        if not channel.users.filter(uuid=request.user.uuid).exists():
            return Response({"error": "User is not in the channel"}, status=status.HTTP_403_FORBIDDEN)

        return JsonResponse({
            'uuid': channel.uuid,
            'type': channel.type,
            'messages': [{
                'uuid': message.uuid,
                'channel_uuid': channel.uuid,
                'type': message.type,
                'content': message.content,
                'created_at': message.created_at,
                'user': {
                    'uuid': message.user.uuid,
                    'display_name': message.user.publicuser.display_name,
                    'avatar': message.user.publicuser.avatar.url if message.user.publicuser.avatar else None,
                }
            } for message in Message.objects.filter(channel=channel)],
            'created_at': channel.created_at,
        })

    def post(self, request, channel_uuid=None):
        if channel_uuid is None:
            return Response({"error": "Channel UUID is required"}, status=status.HTTP_400_BAD_REQUEST)

        content = request.data.get('content')
        channel = Channel.objects.filter(uuid=channel_uuid, users=request.user)
        if not channel.exists():
            return Response({"error": "Channel not found"}, status=status.HTTP_404_NOT_FOUND)

        channel = channel.first()
        if not channel.users.filter(uuid=request.user.uuid).exists():
            return Response({"error": "User is not in the channel"}, status=status.HTTP_403_FORBIDDEN)

        if content is None:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)

        if len(content) > 1000:
            return Response({"error": "Content is too long"}, status=status.HTTP_400_BAD_REQUEST)

        if channel.type == 1:
            receiver = channel.users.exclude(uuid=request.user.uuid).first()
            relation = UserRelation.objects.filter(
                Q(user_1=request.user) | Q(user_2=request.user),
                Q(user_1=receiver) | Q(user_2=receiver),
                type=2,
                )
            if relation.exists():
                return Response({"error": "User is blocked"}, status=status.HTTP_403_FORBIDDEN)


        message = Message.objects.create(type=1, channel=channel, user=request.user, content=content)
        message.save()

        channel_layer = get_channel_layer()
        for user in channel.users.all():
            relation = UserRelation.objects.filter(
                Q(user_1=request.user) | Q(user_2=request.user),
                Q(user_1=user) | Q(user_2=user),
                type=2,
                )

            async_to_sync(channel_layer.group_send)(
                f"user_{str(user.uuid)}",
                {
                    "type": "send_event",
                    "event_name": channel.type == 1 and "DIRECT_MESSAGE_CREATE" or "GAME_MESSAGE_CREATE",
                    "data": {
                        "uuid": str(message.uuid),
                        "channel_uuid": str(channel.uuid),
                        "type": message.type,
                        "content": relation.exists() and "Message is from a blocked user." or message.content,
                        "created_at": str(message.created_at),
                        "user": {
                            "uuid": str(message.user.uuid),
                            "display_name": message.user.publicuser.display_name,
                            "avatar": message.user.publicuser.avatar.url if message.user.publicuser.avatar else None,
                        }
                    }
                }
            )
        channel.updated_at = message.created_at
        channel.save()

        return JsonResponse({
            'uuid': message.uuid,
            'channel_uuid': channel.uuid,
            'type': message.type,
            'content': message.content,
            'created_at': message.created_at,
            'user': {
                'uuid': message.user.uuid,
                'display_name': message.user.publicuser.display_name,
                'avatar': message.user.publicuser.avatar.url if message.user.publicuser.avatar else None,
            }
        })

class UserDirectChannelView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_channels = Channel.objects.filter(users=user, type=1)
        return JsonResponse({
            'channels': [{
                'uuid': channel.uuid,
                'type': channel.type,
                'users': [{
                    'uuid': user.uuid,
                    'display_name': user.publicuser.display_name,
                    'username': user.username,
                    'avatar': user.publicuser.avatar.url if user.publicuser.avatar else None,
                } for user in channel.users.all()],
                'created_at': channel.created_at,
                'updated_at': channel.updated_at,
                'last_message': {
                    'uuid': channel.message_set.last().uuid,
                    'type': channel.message_set.last().type,
                    'content': channel.message_set.last().content,
                    'created_at': channel.message_set.last().created_at,
                    'user': {
                        'uuid': channel.message_set.last().user.uuid,
                        'display_name': channel.message_set.last().user.publicuser.display_name,
                        'avatar': channel.message_set.last().user.publicuser.avatar.url if channel.message_set.last().user.publicuser.avatar else None,
                    }
                } if channel.message_set.last() else None
            } for channel in user_channels]
        })

    def post(self, request):
        receiver_uuid = request.data.get('receiver_uuid')
        sender_user = request.user

        if receiver_uuid is None:
            return Response({"error": "User UUID is required"}, status=status.HTTP_400_BAD_REQUEST)

        if receiver_uuid == sender_user.uuid:
            return Response({"error": "You can't send a message to yourself"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver_user = User.objects.get(uuid=receiver_uuid)
        except User.DoesNotExist:
            return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)

        channel = Channel.objects.filter(users=sender_user).filter(users=receiver_user)

        if not channel.exists():
            channel = Channel.objects.create(type=1)
            channel.users.add(sender_user, receiver_user)
            channel.save()
        else:
            channel = channel.first()

        return JsonResponse({
            'uuid': channel.uuid,
            'type': channel.type,
            'users': [{
                'uuid': user.uuid,
                'display_name': user.publicuser.display_name,
                'username': user.username,
                'avatar': user.publicuser.avatar.url if user.publicuser.avatar else None,
            } for user in channel.users.all()],
            'created_at': channel.created_at,
        })