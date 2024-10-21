"""
URL configuration for transcendence project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from authentication.views import (
    OAuth42LoginView,
    OAuth42CallbackView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/o/", include("oauth2_provider.urls", namespace="oauth2_provider")),
    path("api/auth/", include("authentication.urls")),
    path("api/user/", include("user.urls")),  # Include user URLs


    path("api/oauth/42/", OAuth42LoginView.as_view(), name="oauth_42_login"),
    path("api/oauth/42/callback/",OAuth42CallbackView.as_view(), name="oauth_42_callback"),

    path("api/chat/", include("chat.urls")),  # Include chat URLs

    path("api/game/", include("game.urls")),  # Include game URLs
]
