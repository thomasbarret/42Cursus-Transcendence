from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Match, ChatMessage
from .serializers import MatchSerializer, ChatMessageSerializer

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    @action(detail=True, methods=['post'])
    def end_match(self, request, pk=None):
        match = self.get_object()
        winner_id = request.data.get('winner_id')
        if winner_id:
            match.winner_id = winner_id
            match.is_finished = True
            match.save()
            return Response({'status': 'match ended'})
        return Response({'error': 'Winner ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def chat_messages(self, request, pk=None):
        match = self.get_object()
        messages = ChatMessage.objects.filter(match=match)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)