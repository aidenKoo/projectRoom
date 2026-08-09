#!/bin/bash

# Flutter Dating App - Codespaces Setup Script
echo "🚀 Setting up Flutter Dating App in GitHub Codespaces..."

# Set proper permissions
chmod +x .devcontainer/setup.sh

# Verify Flutter installation
echo "📱 Checking Flutter installation..."
flutter --version
flutter doctor

# Enable Flutter web support
echo "🌐 Enabling Flutter web support..."
flutter config --enable-web

# Install Flutter dependencies
echo "📦 Installing Flutter dependencies..."
flutter pub get

# Verify Node.js and npm
echo "🟢 Checking Node.js installation..."
node --version
npm --version

# Install Cloud Functions dependencies
echo "☁️ Installing Cloud Functions dependencies..."
cd functions
npm install
npm run build
cd ..

# Verify Firebase CLI
echo "🔥 Checking Firebase CLI..."
firebase --version

# Activate FlutterFire CLI
echo "🔧 Activating FlutterFire CLI..."
dart pub global activate flutterfire_cli

# Set up PATH for pub-cache
echo "🛠️ Setting up PATH..."
export PATH="$PATH:/home/cirrus/.pub-cache/bin"
echo 'export PATH="$PATH:/home/cirrus/.pub-cache/bin"' >> ~/.bashrc

# Verify all tools
echo "✅ Verification complete!"
echo "📋 Tool versions:"
echo "Flutter: $(flutter --version | head -n 1)"
echo "Dart: $(dart --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Firebase CLI: $(firebase --version)"

# Show next steps
echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Run 'firebase login' to authenticate with Firebase"
echo "2. Run 'flutterfire configure' to set up Firebase project"
echo "3. Run 'firebase emulators:start' to start Firebase emulators"
echo "4. Run 'flutter run -d web' to start the Flutter app"
echo ""
echo "📍 Available ports:"
echo "- Flutter web: http://localhost:5000"
echo "- Firebase UI: http://localhost:4000"
echo "- Firestore: http://localhost:8080"
echo "- Functions: http://localhost:5001"
echo ""
echo "Happy coding! 💙"