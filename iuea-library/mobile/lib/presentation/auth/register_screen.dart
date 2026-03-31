import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/language_util.dart';
import '../widgets/primary_button.dart';
import '../widgets/custom_input.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey    = GlobalKey<FormState>();
  final _nameCtrl   = TextEditingController();
  final _emailCtrl  = TextEditingController();
  final _passCtrl   = TextEditingController();
  String _language  = 'en';

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok   = await auth.register(
      name:     _nameCtrl.text.trim(),
      email:    _emailCtrl.text.trim(),
      password: _passCtrl.text,
      language: _language,
    );
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
              children: [
                const SizedBox(height: 24),
                Container(
                  padding:    const EdgeInsets.all(14),
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child:      const Icon(Icons.book, color: AppColors.accent, size: 32),
                ),
                const SizedBox(height: 12),
                Text(AppStrings.register, style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.w700,
                )),
                const SizedBox(height: 28),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        CustomInput(label: AppStrings.fullName, controller: _nameCtrl, prefixIcon: Icons.person_outlined,
                          validator: (v) => v == null || v.isEmpty ? 'Name required' : null),
                        const SizedBox(height: 14),
                        CustomInput(label: AppStrings.email, controller: _emailCtrl, keyboardType: TextInputType.emailAddress, prefixIcon: Icons.email_outlined,
                          validator: (v) => v == null || v.isEmpty ? 'Email required' : null),
                        const SizedBox(height: 14),
                        CustomInput(label: AppStrings.password, controller: _passCtrl, isPassword: true, prefixIcon: Icons.lock_outlined,
                          validator: (v) => v == null || v.length < 8 ? 'Min 8 characters' : null),
                        const SizedBox(height: 14),

                        // Language dropdown
                        DropdownButtonFormField<String>(
                          value:       _language,
                          decoration:  const InputDecoration(labelText: 'Preferred Language', prefixIcon: Icon(Icons.language)),
                          items:       LanguageUtil.supportedLanguages.map((l) =>
                            DropdownMenuItem(value: l['code'], child: Text(l['name']!))
                          ).toList(),
                          onChanged: (v) => setState(() => _language = v ?? 'en'),
                        ),
                        const SizedBox(height: 20),

                        PrimaryButton(label: AppStrings.register, onPressed: _submit, isLoading: isLoading),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(AppStrings.haveAccount),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child:     const Text(AppStrings.signIn),
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
