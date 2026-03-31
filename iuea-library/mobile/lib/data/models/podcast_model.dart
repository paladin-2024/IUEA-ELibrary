class EpisodeModel {
  final String  id;
  final String  title;
  final String  description;
  final String  audioUrl;
  final int     duration;   // seconds
  final DateTime? publishedAt;

  const EpisodeModel({
    required this.id,
    required this.title,
    this.description = '',
    required this.audioUrl,
    this.duration   = 0,
    this.publishedAt,
  });

  factory EpisodeModel.fromJson(Map<String, dynamic> json) {
    return EpisodeModel(
      id:          json['_id']         as String? ?? '',
      title:       json['title']       as String,
      description: json['description'] as String? ?? '',
      audioUrl:    json['audioUrl']    as String,
      duration:    (json['duration']   as num?)?.toInt() ?? 0,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'] as String)
          : null,
    );
  }

  String get durationFormatted {
    final m = duration ~/ 60;
    final s = duration  % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}

class PodcastModel {
  final String         id;
  final String         title;
  final String         description;
  final String         author;
  final String         coverUrl;
  final String         language;
  final String?        category;
  final List<EpisodeModel> episodes;
  final int            subscriberCount;

  const PodcastModel({
    required this.id,
    required this.title,
    this.description    = '',
    this.author         = '',
    this.coverUrl       = '',
    this.language       = 'en',
    this.category,
    this.episodes       = const [],
    this.subscriberCount = 0,
  });

  factory PodcastModel.fromJson(Map<String, dynamic> json) {
    return PodcastModel(
      id:          json['_id']         as String,
      title:       json['title']       as String,
      description: json['description'] as String? ?? '',
      author:      json['author']      as String? ?? '',
      coverUrl:    json['coverUrl']    as String? ?? '',
      language:    json['language']    as String? ?? 'en',
      category:    json['category']    as String?,
      episodes:   (json['episodes']    as List<dynamic>?)
              ?.map((e) => EpisodeModel.fromJson(e as Map<String, dynamic>))
              .toList() ?? [],
      subscriberCount: (json['subscribers'] as List<dynamic>?)?.length ?? 0,
    );
  }
}
