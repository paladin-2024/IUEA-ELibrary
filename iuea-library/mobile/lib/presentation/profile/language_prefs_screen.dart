import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/language_util.dart';

class LanguagePrefsScreen extends StatelessWidget {
  const LanguagePrefsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Language Preferences')),
      body: ListView.builder(
        itemCount: LanguageUtil.supportedLanguages.length,
        itemBuilder: (_, i) {
          final lang       = LanguageUtil.supportedLanguages[i];
          final isSelected = auth.user?.language == lang['code'];
          return ListTile(
            title:    Text(lang['name']!),
            subtitle: Text(lang['code']!.toUpperCase()),
            trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
            selected: isSelected,
            onTap:    () {
              // Update language preference
              Navigator.pop(context);
            },
          );
        },
      ),
    );
  }
}
