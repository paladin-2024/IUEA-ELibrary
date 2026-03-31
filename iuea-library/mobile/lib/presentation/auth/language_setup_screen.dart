import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/language_util.dart';
import '../widgets/primary_button.dart';

class LanguageSetupScreen extends StatefulWidget {
  const LanguageSetupScreen({super.key});

  @override
  State<LanguageSetupScreen> createState() => _LanguageSetupScreenState();
}

class _LanguageSetupScreenState extends State<LanguageSetupScreen> {
  String _selected = 'en';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),
              Text('Choose your language', style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.primary, fontWeight: FontWeight.w700,
              )),
              const SizedBox(height: 8),
              Text('Select the language you prefer to read and receive AI responses in.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.grey700)),
              const SizedBox(height: 32),

              Expanded(
                child: ListView.separated(
                  itemCount: LanguageUtil.supportedLanguages.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final lang     = LanguageUtil.supportedLanguages[i];
                    final isSelected = _selected == lang['code'];
                    return GestureDetector(
                      onTap: () => setState(() => _selected = lang['code']!),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color:        isSelected ? AppColors.primary : AppColors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.grey300,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(child: Text(
                              lang['name']!,
                              style: TextStyle(
                                color:      isSelected ? AppColors.white : AppColors.black,
                                fontWeight: FontWeight.w500,
                              ),
                            )),
                            if (isSelected) const Icon(Icons.check_circle, color: AppColors.accent),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),
              PrimaryButton(
                label:     'Continue',
                onPressed: () => context.go('/'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
