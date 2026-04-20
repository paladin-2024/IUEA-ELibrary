class BadgeModel {
  final String id;
  final String label;
  final String desc;
  final int    xp;
  final bool   earned;

  const BadgeModel({
    required this.id,
    required this.label,
    required this.desc,
    required this.xp,
    required this.earned,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> j) => BadgeModel(
    id:     j['id']     as String? ?? '',
    label:  j['label']  as String? ?? '',
    desc:   j['desc']   as String? ?? '',
    xp:     j['xp']     as int?    ?? 0,
    earned: j['earned'] as bool?   ?? false,
  );

  String get emoji {
    switch (id) {
      case 'first_book':    return '📖';
      case 'streak_3':      return '🔥';
      case 'streak_7':      return '⚡';
      case 'streak_30':     return '🏆';
      case 'night_owl':     return '🦉';
      case 'speed_reader':  return '💨';
      case 'polyglot':      return '🌍';
      case 'book_worm':     return '🐛';
      case 'scholar':       return '🎓';
      default:              return '⭐';
    }
  }
}

class StreakModel {
  final int          currentStreak;
  final int          longestStreak;
  final int          totalXp;
  final int          totalReadingMinutes;
  final int          readingGoal;
  final DateTime?    lastReadDate;
  final List<BadgeModel> allBadges;

  const StreakModel({
    required this.currentStreak,
    required this.longestStreak,
    required this.totalXp,
    required this.totalReadingMinutes,
    required this.readingGoal,
    this.lastReadDate,
    required this.allBadges,
  });

  factory StreakModel.fromJson(Map<String, dynamic> j) => StreakModel(
    currentStreak:       j['currentStreak']       as int? ?? 0,
    longestStreak:       j['longestStreak']        as int? ?? 0,
    totalXp:             j['totalXp']              as int? ?? 0,
    totalReadingMinutes: j['totalReadingMinutes']  as int? ?? 0,
    readingGoal:         j['readingGoal']          as int? ?? 20,
    lastReadDate:        j['lastReadDate'] != null ? DateTime.tryParse(j['lastReadDate'] as String) : null,
    allBadges: (j['allBadges'] as List<dynamic>? ?? [])
      .map((b) => BadgeModel.fromJson(b as Map<String, dynamic>))
      .toList(),
  );

  int get level => (totalXp ~/ 100) + 1;
  int get xpProgress => totalXp % 100;
}
