import 'package:flutter_test/flutter_test.dart';
import 'package:projectroom_web/main.dart';

void main() {
  testWidgets('App starts without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    // You can add more specific tests here if needed, e.g., finding a specific text or widget
    // For now, just checking if it pumps without crashing is enough.
  });
}
