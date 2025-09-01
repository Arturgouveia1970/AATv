"""
API views for the streaming application.

These viewsets expose the Category, Language and Channel models via a RESTful
interface. Channels can be filtered by category slug or language code by
supplying query parameters. For example:

    /api/channels/?category_slug=news
    /api/channels/?language_code=en

This flexibility allows the frontend to implement category and language filters
without additional endpoints.
"""

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Category, Language, Channel
from .serializers import CategorySerializer, LanguageSerializer, ChannelSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """Viewset for categories."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'




class LanguageViewSet(viewsets.ModelViewSet):
    """Viewset for languages."""

    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    lookup_field = 'code'


class ChannelViewSet(viewsets.ModelViewSet):
    """Viewset for channels with optional filtering."""

    queryset = Channel.objects.select_related('category', 'language').all()
    serializer_class = ChannelSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category_slug')
        language_code = self.request.query_params.get('language_code')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if language_code:
            queryset = queryset.filter(language__code=language_code)
        return queryset