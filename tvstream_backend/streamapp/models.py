"""
Database models for the streaming application.

The models defined here capture the relationships between TV channels,
categories (e.g. news, sports, kids, movies) and languages. A Channel has a
foreign key to both Category and Language. The stream_url field is expected to
point to an HTTP Live Streaming (HLS) `.m3u8` playlist or any other
appropriate streaming endpoint. If you plan on hosting your own video content
you would typically convert your feed to HLS using an encoder as discussed in
the system design resources【852398102598422†L205-L231】. The Language model
stores ISO language codes and human‑readable names so the frontend can filter
channels by language.
"""

from django.db import models


class Category(models.Model):
    """Represents a grouping of channels such as news, sports, kids or movies."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self) -> str:
        return self.name


class Language(models.Model):
    """Represents a language such as English, Portuguese, etc."""

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name_plural = "Languages"

    def __str__(self) -> str:
        return self.name


class Channel(models.Model):
    """
    Represents an individual TV channel that can be streamed via HLS.

    Each channel references a Category and a Language. Languages are stored in
    a separate model so they can be reused across channels and exposed via
    their ISO code. The language field is a ForeignKey to the Language model.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, related_name='channels', on_delete=models.CASCADE)
    language = models.ForeignKey(Language, related_name='channels', on_delete=models.PROTECT)
    stream_url = models.URLField(help_text="URL to the HLS (.m3u8) playlist")
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True)
    is_live = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name