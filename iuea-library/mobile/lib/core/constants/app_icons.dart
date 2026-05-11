import 'package:flutter/widgets.dart';
import 'package:lucide_icons/lucide_icons.dart';

abstract class AppIcons {
  // ── Navigation ──────────────────────────────────────────────────────────
  static const IconData home            = LucideIcons.home;
  static const IconData arrowBack       = LucideIcons.arrowLeft;
  static const IconData arrowForward    = LucideIcons.arrowRight;
  static const IconData chevronRight    = LucideIcons.chevronRight;
  static const IconData chevronDown     = LucideIcons.chevronDown;
  static const IconData chevronUp       = LucideIcons.chevronUp;
  static const IconData moreVert        = LucideIcons.moreVertical;
  static const IconData close           = LucideIcons.x;

  // ── Books & Reading ──────────────────────────────────────────────────────
  static const IconData book            = LucideIcons.book;
  static const IconData bookpen         = LucideIcons.bookOpen;
  static const IconData bookark         = LucideIcons.bookmark;
  static const IconData bookarkFilled   = LucideIcons.bookmarkMinus;
  // ignore: constant_identifier_names
  static const IconData bookark_added_outlined = LucideIcons.bookmarkPlus;
  static const IconData library         = LucideIcons.library;
  static const IconData pdf             = LucideIcons.fileText;
  static const IconData textSize        = LucideIcons.type;

  // ── Audio / Podcasts ─────────────────────────────────────────────────────
  static const IconData podcasts        = LucideIcons.radio;
  static const IconData headphones      = LucideIcons.headphones;
  static const IconData play            = LucideIcons.play;
  static const IconData pause           = LucideIcons.pause;
  static const IconData rewind          = LucideIcons.rewind;
  static const IconData skipForward     = LucideIcons.skipForward;
  static const IconData volume          = LucideIcons.volume2;
  static const IconData mic             = LucideIcons.mic;

  // ── User / Profile ───────────────────────────────────────────────────────
  static const IconData person          = LucideIcons.user;
  static const IconData personOutline   = LucideIcons.userCircle;
  static const IconData school          = LucideIcons.graduationCap;
  static const IconData email           = LucideIcons.mail;
  static const IconData lock            = LucideIcons.lock;
  static const IconData eyeOn           = LucideIcons.eye;
  static const IconData eyeOff          = LucideIcons.eyeOff;
  static const IconData logout          = LucideIcons.logOut;
  static const IconData settings        = LucideIcons.settings;
  static const IconData supportAgent    = LucideIcons.headphones;
  static const IconData phone           = LucideIcons.phone;
  static const IconData palette         = LucideIcons.palette;

  // ── Search & Discovery ───────────────────────────────────────────────────
  static const IconData search          = LucideIcons.search;
  static const IconData searchOff       = LucideIcons.searchX;

  // ── Actions ──────────────────────────────────────────────────────────────
  static const IconData download        = LucideIcons.download;
  static const IconData downloadDone    = LucideIcons.downloadCloud;
  static const IconData share           = LucideIcons.share2;
  static const IconData copy            = LucideIcons.copy;
  static const IconData edit            = LucideIcons.pencil;
  static const IconData delete          = LucideIcons.trash2;
  static const IconData send            = LucideIcons.send;
  static const IconData refresh         = LucideIcons.refreshCw;
  static const IconData translate       = LucideIcons.languages;
  static const IconData tune            = LucideIcons.slidersHorizontal;
  static const IconData spellCheck      = LucideIcons.spellCheck;
  static const IconData thumbUp         = LucideIcons.thumbsUp;

  // ── Feedback & Status ────────────────────────────────────────────────────
  static const IconData check           = LucideIcons.check;
  static const IconData checkCircle     = LucideIcons.checkCircle;
  static const IconData error           = LucideIcons.alertCircle;
  static const IconData warning         = LucideIcons.alertTriangle;
  static const IconData info            = LucideIcons.info;
  static const IconData cloudOff        = LucideIcons.cloudOff;

  // ── Notifications ────────────────────────────────────────────────────────
  static const IconData notification       = LucideIcons.bell;
  static const IconData notificationOff    = LucideIcons.bellOff;
  static const IconData notificationActive = LucideIcons.bellRing;

  // ── UI Layout ────────────────────────────────────────────────────────────
  static const IconData grid            = LucideIcons.layoutGrid;
  static const IconData list            = LucideIcons.list;
  static const IconData viewList        = LucideIcons.layoutList;
  static const IconData calendar        = LucideIcons.calendar;
  static const IconData clock           = LucideIcons.clock;
  static const IconData location        = LucideIcons.mapPin;
  static const IconData language        = LucideIcons.globe;

  // ── Misc ─────────────────────────────────────────────────────────────────
  static const IconData heart           = LucideIcons.heart;
  static const IconData heartOutline    = LucideIcons.heart;
  static const IconData star            = LucideIcons.star;
  static const IconData starOutline     = LucideIcons.star;
  static const IconData fire            = LucideIcons.flame;
  static const IconData aiSparkle       = LucideIcons.sparkles;
  static const IconData bot             = LucideIcons.bot;
  static const IconData lightMode       = LucideIcons.sun;
  static const IconData darkMode        = LucideIcons.moon;
}
