import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/language_util.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Avatar card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius:          30,
                          backgroundColor: AppColors.primary,
                          child:           Text(user.name.substring(0, 1).toUpperCase(),
                            style: const TextStyle(color: AppColors.white, fontSize: 22, fontWeight: FontWeight.w700)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(user.name,  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                            Text(user.email, style: const TextStyle(color: AppColors.grey500, fontSize: 13)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color:        AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(user.role.toUpperCase(),
                                style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        )),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Language
                Card(
                  child: ListTile(
                    leading:  const Icon(Icons.language, color: AppColors.primary),
                    title:    const Text('Language'),
                    subtitle: Text(LanguageUtil.getLanguageName(user.language)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap:    () => _showLanguagePicker(context, auth),
                  ),
                ),

                // Reading preferences
                Card(
                  child: ListTile(
                    leading:  const Icon(Icons.text_fields, color: AppColors.primary),
                    title:    const Text('Reading Preferences'),
                    subtitle: Text('Font: ${user.preferences.fontSize}px · Theme: ${user.preferences.theme}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap:    () {},
                  ),
                ),

                // Notifications
                Card(
                  child: SwitchListTile(
                    secondary: const Icon(Icons.notifications_outlined, color: AppColors.primary),
                    title:    const Text('Notifications'),
                    value:    user.preferences.notifications,
                    activeColor: AppColors.primary,
                    onChanged: (_) {},
                  ),
                ),

                const SizedBox(height: 16),

                // Logout
                OutlinedButton.icon(
                  onPressed: () => auth.logout(),
                  icon:      const Icon(Icons.logout, color: AppColors.error),
                  label:     const Text('Sign Out', style: TextStyle(color: AppColors.error)),
                  style:     OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
                ),
              ],
            ),
    );
  }

  void _showLanguagePicker(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ListView(
        shrinkWrap: true,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child:   Text('Choose Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          ),
          ...LanguageUtil.supportedLanguages.map((l) => ListTile(
            title:    Text(l['name']!),
            trailing: auth.user?.language == l['code']
                ? const Icon(Icons.check, color: AppColors.primary)
                : null,
            onTap:    () => Navigator.pop(context),
          )),
        ],
      ),
    );
  }
}
