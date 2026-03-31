import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    final token = await const FlutterSecureStorage().read(key: 'jwt_token');
    if (!mounted) return;
    context.go(token != null ? '/home' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88, height: 88,
              decoration: const BoxDecoration(
                color: AppColors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.school, color: AppColors.primary, size: 48),
            ),
            const SizedBox(height: 24),
            Text('IUEA Library',
              style: AppTextStyles.h2.copyWith(color: AppColors.white)),
            const SizedBox(height: 8),
            Text('Your knowledge. Unlimited access.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.white.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}
