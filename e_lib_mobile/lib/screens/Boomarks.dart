import 'package:flutter/material.dart';

class BookmarksPage extends StatelessWidget {
  const BookmarksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Bookmarks'),
        backgroundColor: const Color(0xFF8B4453), // Maroon color
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bookmark,
              size: 100,
              color: const Color(0xFF8B4453),
            ),
            const SizedBox(height: 20),
            const Text(
              'Your Bookmarks',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF8B4453),
              ),
            ),
            const SizedBox(height: 20),
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Save your favorite books and access them anytime',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF999999), // Grey color
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

