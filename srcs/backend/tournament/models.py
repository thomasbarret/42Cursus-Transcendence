from django.db import models
from django.apps import apps
import uuid
from django.utils import timezone

class Tournament(models.Model):
    status_type = (
        (1, "PENDING"),
        (2, "ACTIVE"),
        (3, "FINISHED"),
        (4, "CANCELLED"),
    )
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.IntegerField(choices=status_type, default=1)
    players = models.ManyToManyField('game.MatchPlayer', related_name='tournaments')
    winner = models.ForeignKey('game.MatchPlayer', on_delete=models.CASCADE, related_name='tournament_winner', null=True, blank=True)

    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('game.MatchPlayer', on_delete=models.CASCADE, related_name='created_tournaments')

    channel = models.ForeignKey('chat.Channel', on_delete=models.CASCADE, related_name='tournament')
    current_match = models.ForeignKey('game.Match', on_delete=models.SET_NULL, related_name='current_tournament_match', null=True, blank=True)
    max_score = models.IntegerField(default=3)
    matches = models.ManyToManyField('game.Match', related_name='tournaments')

    def create_all_matches(self):
        Match = apps.get_model('game', 'Match')  # Résout la dépendance circulaire
        players = list(self.players.all())
        matches = []

        for i in range(len(players)):
            for j in range(i + 1, len(players)):
                match = Match.objects.create(
                    player1=players[i],
                    player2=players[j],
                    max_score=self.max_score
                )
                match.tournament = self
                match.save()
                matches.append(match)

        self.matches.add(*matches)
        self.current_match = matches[0] if matches else None
        self.status = 2
        self.save()

    def start_next_match(self):
        # if not self.current_match or not self.current_match.winner:
        #     raise ValueError("The current match is not finished or does not exist")

        next_match = self.matches.exclude(id=self.current_match.id).filter(winner__isnull=True).first()

        if next_match:
            self.current_match = next_match
        else:
            self.calculate_winner()
            self.status = 3
            self.end_date = timezone.now()

        self.save()

    def calculate_winner(self):
        scores = {}
        goal_difference = {}

        for match in self.matches.all():
            if match.winner:
                scores[match.winner] = scores.get(match.winner, 0) + 3  # Victoire = 3 points
                goal_difference[match.winner] = goal_difference.get(match.winner, 0) + (match.player1_score - match.player2_score if match.winner == match.player1 else match.player2_score - match.player1_score)

        top_score = max(scores.values(), default=0)
        top_players = [player for player, score in scores.items() if score == top_score]

        if len(top_players) == 1:
            self.winner = top_players[0]
        else:
            self.winner = max(top_players, key=lambda player: goal_difference.get(player, 0))

        self.save()
