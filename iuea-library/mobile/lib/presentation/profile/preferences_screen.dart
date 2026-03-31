import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';

class PreferencesScreen extends StatelessWidget {
  const PreferencesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Reading Preferences')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Font Size', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton(
                icon:      const Icon(Icons.remove),
                onPressed: () => reader.setFontSize(reader.fontSize - 2),
              ),
              Expanded(child: Slider(
                value:       reader.fontSize,
                min:         12,
                max:         28,
                divisions:   8,
                label:       '${reader.fontSize.toInt()}px',
                activeColor: AppColors.primary,
                onChanged:   (v) => reader.setFontSize(v),
              )),
              IconButton(
                icon:      const Icon(Icons.add),
                onPressed: () => reader.setFontSize(reader.fontSize + 2),
              ),
            ],
          ),
          const Divider(height: 28),
          const Text('Theme', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 8),
          Row(
            children: ReaderTheme.values.map((t) => Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label:    Text(t.name[0].toUpperCase() + t.name.substring(1)),
                  selected: reader.theme == t,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: reader.theme == t ? AppColors.white : AppColors.black,
                  ),
                  onSelected: (_) => reader.setTheme(t),
                ),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}
