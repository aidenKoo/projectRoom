
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Based on section 19.2 of 작업서1.1.txt

class AppColors {
  // Light Theme
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF7F7F8);
  static const Color lightTextPrimary = Color(0xFF16181C);
  static const Color lightTextSecondary = Color(0xFF6B7280);
  static const Color lightBorder = Color.fromRGBO(22, 24, 28, 0.08);


  // Dark Theme
  static const Color darkBackground = Color(0xFF0B0B0C);
  static const Color darkSurface = Color(0xFF121214);
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFFA0A3A7);
  static const Color darkBorder = Color.fromRGBO(255, 255, 255, 0.06);

  // Common
  static const Color accent = Color(0xFF4B8BFF);
  static const Color danger = Color(0xFFFF5C5C);
  static const Color success = Color(0xFF2ECC71);
  static const Color warning = Color(0xFFFFB020);
}

class AppTextStyles {
  // Using Inter as the sub-font, as Pretendard is not available via google_fonts.
  // It should be added locally to the project for full design compliance.
  static final TextTheme textTheme = GoogleFonts.interTextTheme();

  static TextStyle get h1 => textTheme.displayLarge!.copyWith(
        fontSize: 24,
        height: 32 / 24,
        fontWeight: FontWeight.bold,
      );

  static TextStyle get h2 => textTheme.displayMedium!.copyWith(
        fontSize: 20,
        height: 28 / 20,
        fontWeight: FontWeight.bold,
      );

  static TextStyle get body => textTheme.bodyLarge!.copyWith(
        fontSize: 15,
        height: 22 / 15,
      );
  
  static TextStyle get bodySmall => textTheme.bodyMedium!.copyWith(
        fontSize: 14,
        height: 20 / 14,
      );

  static TextStyle get caption => textTheme.bodySmall!.copyWith(
        fontSize: 13,
        height: 18 / 13,
      );
}

class AppTheme {
  static ThemeData light() {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.accent,
      scaffoldBackgroundColor: AppColors.lightBackground,
      colorScheme: const ColorScheme.light(
        primary: AppColors.accent,
        secondary: AppColors.accent,
        surface: AppColors.lightSurface,
        error: AppColors.danger,
        onPrimary: AppColors.darkTextPrimary,
        onSecondary: AppColors.darkTextPrimary,
        onSurface: AppColors.lightTextPrimary,
        onError: AppColors.darkTextPrimary,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme,
      ).copyWith(
        displayLarge: AppTextStyles.h1.copyWith(color: AppColors.lightTextPrimary),
        displayMedium: AppTextStyles.h2.copyWith(color: AppColors.lightTextPrimary),
        bodyLarge: AppTextStyles.body.copyWith(color: AppColors.lightTextPrimary),
        bodyMedium: AppTextStyles.bodySmall.copyWith(color: AppColors.lightTextSecondary),
        bodySmall: AppTextStyles.caption.copyWith(color: AppColors.lightTextSecondary),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.lightTextPrimary),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.lightBorder, width: 1),
        ),
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.accent,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.accent,
        secondary: AppColors.accent,
        surface: AppColors.darkSurface,
        error: AppColors.danger,
        onPrimary: AppColors.darkTextPrimary,
        onSecondary: AppColors.darkTextPrimary,
        onSurface: AppColors.darkTextPrimary,
        onError: AppColors.darkTextPrimary,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ).copyWith(
        displayLarge: AppTextStyles.h1.copyWith(color: AppColors.darkTextPrimary),
        displayMedium: AppTextStyles.h2.copyWith(color: AppColors.darkTextPrimary),
        bodyLarge: AppTextStyles.body.copyWith(color: AppColors.darkTextPrimary),
        bodyMedium: AppTextStyles.bodySmall.copyWith(color: AppColors.darkTextSecondary),
        bodySmall: AppTextStyles.caption.copyWith(color: AppColors.darkTextSecondary),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.darkTextPrimary),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        color: AppColors.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
      ),
    );
  }
}
