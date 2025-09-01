"""
Admin configuration for the streaming models.

This module registers the Category, Language and Channel models with the Django
admin and provides some basic list displays. In a production environment you
could extend these with search, filters or custom actions to manage large
numbers of channels.
"""

from django.contrib import admin
from .models import Category, Language, Channel


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')




@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'language', 'is_live')
    # Filter by category, language and live status. Language is a foreign key
    # here, so Django will provide a select list of existing languages.
    list_filter = ('category', 'language', 'is_live')
    search_fields = ('name', 'description', 'stream_url')