"""
Serializers for the streaming application.

The serializers convert model instances to JSON representations suitable for
transmission over the REST API. Nested relationships are included where
useful—for example, ChannelSerializer includes the names of the category and
language rather than embedding entire objects.
"""

from rest_framework import serializers
from .models import Category, Language, Channel


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']




class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'name', 'code']


class ChannelSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    language = LanguageSerializer(read_only=True)

    class Meta:
        model = Channel
        fields = [
            'id', 'name', 'description', 'category', 'language',
            'stream_url', 'thumbnail', 'is_live', 'created_at', 'updated_at'
        ]