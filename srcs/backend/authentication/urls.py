from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    OAuth42LoginView,
    OAuth42CallbackView,

    # 2FA
    Enable2FAView,
    Confirm2FAView,
    Disable2FAView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # 2FA
    path('2fa/enable/', Enable2FAView.as_view(), name='enable_2fa'),
    path('2fa/confirm/', Confirm2FAView.as_view(), name='confirm_2fa'),
    path('2fa/disable/', Disable2FAView.as_view(), name='disable_2fa'),

]
