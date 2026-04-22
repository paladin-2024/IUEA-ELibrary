# Mobile: Author Page + Faculty Browse Screens

**Date:** 2026-04-22  
**Scope:** Two new full-screen Flutter routes — `AuthorScreen` and `FacultyScreen`  
**Platform:** Mobile only (iOS + Android)

---

## 1. Overview

Two screens are referenced in the IUEA design system but have no Flutter implementation:

| Screen | Route | Entry point |
|---|---|---|
| Author Page | `/author/:name` | Author name tap in `BookDetailScreen` |
| Faculty Browse | `/faculty/:name` | Faculty pill tap in `HomeScreen` |

Both are full-screen routes (no bottom nav), following the same GoRouter pattern as `/books/:id`.

---

## 2. API Strategy

No new backend endpoints are needed.

- **Author page** — `GET /api/books?q=<authorName>` using the existing books search endpoint. The author name is URL-encoded as the query string. Results are all books whose `author` field matches or contains the name.
- **Faculty browse** — `GET /api/books?faculty=<facultyName>&sort=newest` using the existing `faculty` filter on the books endpoint.

Both screens pass `limit=40` to retrieve enough books for a full grid.

---

## 3. Author Page (`AuthorScreen`)

### Route & Navigation
- Path: `/author/:name` (URL-encoded author name as path parameter)
- Full-screen, no bottom nav
- Entry: tap the author name text in `BookDetailScreen` → `context.push('/author/${Uri.encodeComponent(book.author)}')`

### Layout

```
SliverAppBar (pinned)
  └─ leading: BackButton
  └─ actions: Follow pill button (maroon, toggles local state — no backend)

Body (CustomScrollView)
  ├─ Author avatar (180×180, rounded corners, from first book coverUrl or placeholder icon)
  ├─ Stats row: "[N] BOOKS  ·  — FOLLOWERS"
  ├─ Author name (AppTextStyles.displaySmall, Playfair Display / serif)
  ├─ Category subtitle (most common category across books, UPPERCASED, AppColors.primary)
  ├─ Quote card (italic, 3-line max, from highest-rated book description; hidden if empty)
  ├─ Section header: "Books by this author" + "VIEW ALL" (scrolls to grid anchor)
  └─ 2-column GridView of BookCard widgets
```

### States
- **Loading:** shimmer grid (4 placeholder cards, same 2-column layout)
- **Empty:** centred icon + "No books found for this author"
- **Error:** centred message + retry button

### Follow button
Local `bool _following` state only. Toggles label between "Follow" and "Following". No backend call. This is a UI placeholder until a follow system is built.

### Author stats derivation
- `N Books` = length of results list
- `Followers` = displayed as `—` (no backend count available)
- `Category subtitle` = most frequent `book.category` in results list
- `Quote` = `description` of the book with the highest `rating` in results; truncated to 200 chars + ellipsis

---

## 4. Faculty Browse (`FacultyScreen`)

### Route & Navigation
- Path: `/faculty/:name` (faculty name as path parameter, e.g. `Law`, `Medicine`)
- Full-screen, no bottom nav
- Entry: tap a faculty pill on `HomeScreen` → `context.push('/faculty/$faculty')`

### Layout

```
AppBar
  └─ leading: BackButton
  └─ title: "[Faculty Name]" (e.g. "Faculty of Law")

Subheader row (below AppBar, sticky)
  ├─ "[N] PUBLICATIONS" (small caps label, AppColors.textSecondary)
  ├─ Spacer
  ├─ Sort dropdown: Recent | Popular | Title A–Z  (default: Recent)
  └─ Grid/List toggle icon button

Body
  └─ GridView (2 columns, default) or ListView (1 column, toggle)
     └─ BookCard widgets (existing component)
```

### Sort behaviour
Sort is client-side on the already-fetched list (no extra API calls):
- **Recent** — sort by `publishedYear` descending
- **Popular** — sort by `rating` descending
- **Title A–Z** — sort by `title` ascending

### States
- **Loading:** shimmer grid (6 placeholder cards)
- **Empty:** centred icon + "No books found in [Faculty]"
- **Error:** centred message + retry button
- Pull-to-refresh re-fetches from API

---

## 5. Shared Implementation Details

### New files
```
lib/presentation/book/author_screen.dart
lib/presentation/library/faculty_screen.dart
```

### Router changes (`app_router.dart`)
Add two full-screen routes (outside the ShellRoute):
```dart
GoRoute(
  path: '/author/:name',
  builder: (_, state) => AuthorScreen(authorName: Uri.decodeComponent(state.pathParameters['name']!)),
),
GoRoute(
  path: '/faculty/:name',
  builder: (_, state) => FacultyScreen(facultyName: state.pathParameters['name']!),
),
```

### BookRepository additions
Two new methods in `book_repository.dart`:
```dart
Future<List<BookModel>> getBooksByAuthor(String authorName)
Future<List<BookModel>> getBooksByFaculty(String facultyName)
```
Both use the existing `getBooks()` method with appropriate filter params.

### ApiConstants additions
No new constants needed — both use `ApiConstants.books` with query params.

### Entry point wiring
1. `BookDetailScreen` — wrap existing author text in `GestureDetector` → `context.push('/author/...')`
2. `HomeScreen` — faculty pill `onTap` → `context.push('/faculty/$faculty')` instead of current in-place filter

### No new providers needed
Both screens manage their own local state (`StatefulWidget` with `_books`, `_loading`, `_error` fields) and call the repository directly. The data is screen-specific and not shared across the app.

---

## 6. Design Tokens

Both screens use existing tokens only:
- Colors: `AppColors.primary`, `AppColors.surface`, `AppColors.surfaceContainerLow`, `AppColors.textSecondary`
- Typography: `AppTextStyles.displaySmall` (author name), `AppTextStyles.headlineMedium` (faculty title), `AppTextStyles.body`, `AppTextStyles.label`
- Spacing: `AppSpacing.pagePadding` (16), `AppSpacing.md` (12), `AppSpacing.sm` (8)
- `BookCard` widget: used as-is, no modifications

---

## 7. Out of Scope

- Backend follow/unfollow endpoint (Follow button is local state only)
- Author biography API (no such endpoint exists)
- Follower count (shown as `—`)
- Pagination / infinite scroll (single fetch of 40 books is sufficient for MVP)
