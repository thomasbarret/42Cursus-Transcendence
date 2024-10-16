from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from authentication.models import PublicUser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

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
            'display_name': public_user.display_name,
            'avatar': public_user.avatar.url if public_user.avatar else None,
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