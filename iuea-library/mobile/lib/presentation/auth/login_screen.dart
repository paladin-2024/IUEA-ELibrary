import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../widgets/primary_button.dart';
import '../widgets/custom_input.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey    = GlobalKey<FormState>();
  final _emailCtrl  = TextEditingController();
  final _passCtrl   = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth  = context.read<AuthProvider>();
    final ok    = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? AppStrings.genericError), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                // Logo
                Container(
                  padding:      const EdgeInsets.all(16),
                  decoration:   const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child:        const Icon(Icons.book, color: AppColors.accent, size: 36),
                ),
                const SizedBox(height: 16),
                Text(AppStrings.appName, style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.w700,
                )),
                Text(AppStrings.tagline, style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.grey500,
                )),
                const SizedBox(height: 40),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        CustomInput(
                          label:        AppStrings.email,
                          controller:   _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon:   Icons.email_outlined,
                          validator:    (v) => v == null || v.isEmpty ? 'Email required' : null,
                        ),
                        const SizedBox(height: 16),
                        CustomInput(
                          label:      AppStrings.password,
                          controller: _passCtrl,
                          isPassword: true,
                          prefixIcon: Icons.lock_outlined,
                          validator:  (v) => v == null || v.length < 6 ? 'Min 6 characters' : null,
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child:     TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            child:     const Text(AppStrings.forgotPw),
                          ),
                        ),
                        const SizedBox(height: 8),
                        PrimaryButton(
                          label:     AppStrings.login,
                          onPressed: _submit,
                          isLoading: isLoading,
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(AppStrings.noAccount),
                    TextButton(
                      onPressed: () => context.go('/register'),
                      child:     const Text(AppStrings.signUp),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
