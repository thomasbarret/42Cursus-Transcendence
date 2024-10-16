from django.urls import path
from .views import (
    UserDirectChannelView,
    ChannelView,
)

urlpatterns = [
    path('@me/', UserDirectChannelView.as_view(), name='direct_channel_list'),
    path('<uuid:channel_uuid>/', ChannelView.as_view(), name='channel'),
]