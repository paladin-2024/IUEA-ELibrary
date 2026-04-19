import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// AppBottomNav — pixel-perfect match to Stitch design.
///
/// - backdrop blur + white/80 bg
/// - rounded-t-2xl top corners
/// - subtle top border shadow
/// - 5 items: Home / Library / Podcasts / Downloads / Profile
/// - active: AppColors.primaryContainer (#7B0D1E maroon)
/// - inactive: AppColors.onSurfaceVariant.withOpacity(0.4)
class AppBottomNav extends StatelessWidget {
  final int currentIndex;
  final void Function(int) onTap;

  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  static const _items = [
    _NavItem(Icons.home_outlined,     Icons.home_rounded,      'Home'),
    _NavItem(Icons.menu_book_outlined, Icons.menu_book_rounded, 'Library'),
    _NavItem(Icons.podcasts_outlined,  Icons.podcasts_rounded,  'Podcasts'),
    _NavItem(Icons.download_outlined,  Icons.download_rounded,  'Downloads'),
    _NavItem(Icons.person_outline,     Icons.person_rounded,    'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest.withOpacity(0.85),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(
                color: AppColors.outlineVariant.withOpacity(0.15),
              ),
            ),
            boxShadow: [
              BoxShadow(
                color:  Colors.black.withOpacity(0.06),
                blurRadius:  20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 60,
              child: Row(
                children: List.generate(_items.length, (i) {
                  final item   = _items[i];
                  final active = i == currentIndex;
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => onTap(i),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 200),
                              transitionBuilder: (child, anim) => ScaleTransition(
                                scale: anim,
                                child: child,
                              ),
                              child: Icon(
                                active ? item.iconFilled : item.iconOutlined,
                                key:   ValueKey(active),
                                color: active
                                    ? AppColors.primaryContainer
                                    : AppColors.onSurfaceVariant.withOpacity(0.45),
                                size:  active ? 24 : 22,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              item.label,
                              style: TextStyle(
                                fontFamily:    'Inter',
                                fontSize:      10,
                                fontWeight:    active ? FontWeight.w600 : FontWeight.w400,
                                color:         active
                                    ? AppColors.primaryContainer
                                    : AppColors.onSurfaceVariant.withOpacity(0.45),
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData iconOutlined;
  final IconData iconFilled;
  final String   label;
  const _NavItem(this.iconOutlined, this.iconFilled, this.label);
}
