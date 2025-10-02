import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ChatService {
  WebSocketChannel? _channel;
  final StreamController<dynamic> _messagesController = StreamController.broadcast();

  Stream<dynamic> get messages => _messagesController.stream;

  Future<void> connect(String matchId) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }
    final token = await user.getIdToken();

    // The WebSocket URL needs to match your backend configuration.
    // Passing the token for authentication.
    final uri = Uri.parse('ws://localhost:3001?token=$token');

    _channel = WebSocketChannel.connect(uri);

    _channel!.stream.listen(
      (data) {
        _messagesController.add(jsonDecode(data));
      },
      onError: (error) {
        print('WebSocket Error: $error');
        _messagesController.addError(error);
      },
      onDone: () {
        print('WebSocket connection closed');
      },
    );

    // After connecting, join the specific chat room
    sendMessage('joinRoom', {'matchId': matchId});
  }

  void sendMessage(String event, dynamic data) {
    if (_channel == null) {
      print('WebSocket is not connected.');
      return;
    }
    final message = jsonEncode({
      'event': event,
      'data': data,
    });
    _channel!.sink.add(message);
  }

  void dispose() {
    _channel?.sink.close();
    _messagesController.close();
  }
}
