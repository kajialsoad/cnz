import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';

class TranslatedText extends StatelessWidget {
  final String text;
  final String? bn;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const TranslatedText(
    this.text, {
    super.key,
    this.bn,
    this.style,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        // If language is Bangla and we have a static translation, use it
        if (languageProvider.isBangla && bn != null) {
          return Text(
            bn!,
            style: style,
            textAlign: textAlign,
            maxLines: maxLines,
            overflow: overflow,
          );
        }

        // Otherwise use dynamic translation
        return FutureBuilder<String>(
          future: languageProvider.translate(text),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Text(
                text, // Show original while loading
                style: style,
                textAlign: textAlign,
                maxLines: maxLines,
                overflow: overflow,
              );
            }
            
            return Text(
              snapshot.data ?? text,
              style: style,
              textAlign: textAlign,
              maxLines: maxLines,
              overflow: overflow,
            );
          },
        );
      },
    );
  }
}
