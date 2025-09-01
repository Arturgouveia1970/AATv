"""
URL routing for the streaming app API.

The routers map HTTP endpoints to the viewsets defined in views.py. The base
prefix is already included in the project urls (``/api/``) so the patterns
registered here appear under paths like `/api/categories/` or `/api/channels/`.
"""

from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import CategoryViewSet, LanguageViewSet, ChannelViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'languages', LanguageViewSet)
router.register(r'channels', ChannelViewSet)

urlpatterns = [
    path('', include(router.urls)),
]