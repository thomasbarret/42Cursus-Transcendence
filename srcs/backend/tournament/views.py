from django.shortcuts import render
from .models import Tournament
from game.models import Match, MatchPlayer

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from authentication.views import TokenFromCookieAuthentication
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Q

def get_avatar_url(user):
    return user.publicuser.avatar.url if user.publicuser.avatar else None

class TournamentView(APIView):
    authentication_classes = [TokenFromCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(seft, request):
        name = request.data.get('name')
        max_players = request.data.get('max_players')
        max_score = request.data.get('max_score')
        max_rounds = request.data.get('max_rounds')

        if not name or not max_players or not max_score or not max_rounds:
            return Response({
                'error': 'name, max_players, max_score and max_rounds are required'
            }, status=status.HTTP_400_BAD)

        creator_player, created = MatchPlayer.objects.get_or_create(
            user=request.user,
            defaults={'display_name': request.user.publicuser.display_name}
        )


        tournament = Tournament.objects.create(
            name=name,
            max_players=max_players,
            max_score=max_score,
            created_by=creator_player
        )

        return JsonResponse({
            'uuid': tournament.uuid,
            'name': tournament.name,
            'max_players': tournament.max_players,
            'max_rounds': tournament.max_rounds,
            'max_score': tournament.max_score,
            'created_at': tournament.created_at,
        })