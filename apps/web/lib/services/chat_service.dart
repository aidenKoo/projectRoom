import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  IO.Socket? _socket;
  final _messageStreamController = StreamController<dynamic>.broadcast();

  Stream<dynamic> get messages => _messageStreamController.stream;

  Future<void> connect(String matchId) async {
    if (_socket?.connected == true) {
      return;
    }

    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    if (token == null) {
      throw Exception('Authentication token not found.');
    }

    _socket = IO.io('http://localhost:3001/chat', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.onConnect((_) {
      print('Socket connected');
      // Join the specific conversation room
      _socket!.emit('conversation:join', {'matchId': matchId});
    });

    _socket!.on('message:new', (data) {
      _messageStreamController.add(data);
    });

    _socket!.onDisconnect((_) => print('Socket disconnected'));
    _socket!.onError((data) => print('Socket error: $data'));

    _socket!.connect();
  }

  void sendMessage(String event, dynamic data) {
    if (_socket?.connected == true) {
      _socket!.emit(event, data);
    }
  }

  void dispose() {
    _messageStreamController.close();
    _socket?.dispose();
  }
}