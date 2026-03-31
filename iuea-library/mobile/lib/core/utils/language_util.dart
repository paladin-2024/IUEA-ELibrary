class LanguageUtil {
  static const List<Map<String, String>> supportedLanguages = [
    {'name': 'English',     'code': 'en', 'ttsLang': 'en-US', 'flutterLocale': 'en'},
    {'name': 'Swahili',     'code': 'sw', 'ttsLang': 'sw-KE', 'flutterLocale': 'sw'},
    {'name': 'French',      'code': 'fr', 'ttsLang': 'fr-FR', 'flutterLocale': 'fr'},
    {'name': 'Arabic',      'code': 'ar', 'ttsLang': 'ar-SA', 'flutterLocale': 'ar'},
    {'name': 'Luganda',     'code': 'lg', 'ttsLang': 'lg',    'flutterLocale': 'lg'},
    {'name': 'Kinyarwanda', 'code': 'rw', 'ttsLang': 'rw',    'flutterLocale': 'rw'},
    {'name': 'Somali',      'code': 'so', 'ttsLang': 'so',    'flutterLocale': 'so'},
    {'name': 'Amharic',     'code': 'am', 'ttsLang': 'am-ET', 'flutterLocale': 'am'},
  ];

  static String getLanguageName(String code) {
    final lang = supportedLanguages.firstWhere(
      (l) => l['code'] == code,
      orElse: () => {'name': 'English'},
    );
    return lang['name'] ?? 'English';
  }

  static String getTtsLang(String code) {
    final lang = supportedLanguages.firstWhere(
      (l) => l['code'] == code,
      orElse: () => {'ttsLang': 'en-US'},
    );
    return lang['ttsLang'] ?? 'en-US';
  }

  static bool isRtl(String code) => code == 'ar';
}
