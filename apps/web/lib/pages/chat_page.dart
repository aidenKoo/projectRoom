import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/chat_service.dart';

final matchDetailsProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, matchId) {
  return apiService.getMatch(matchId);
});

class ChatPage extends ConsumerStatefulWidget {
  final String matchId;
  const ChatPage({required this.matchId, super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _chatService = ChatService();
  final List<dynamic> _messages = [];
  
  String? _currentUserId;
  bool _isLoadingHistory = true;
  // In a real app, this would be determined by the match details from the API
  bool _showThreeQuestionWidget = true; 

  @override
  void initState() {
    super.initState();
    _currentUserId = FirebaseAuth.instance.currentUser?.uid;
    _loadHistoryAndConnect();
  }

  Future<void> _loadHistoryAndConnect() async {
    setState(() => _isLoadingHistory = true);
    try {
      final history = await apiService.getMessages(widget.matchId);
      _messages.addAll(history);

      await _chatService.connect(widget.matchId);
      _chatService.messages.listen((message) {
        if (!_messages.any((m) => m['id'] == message['id'])) {
          setState(() => _messages.insert(0, message));
          _scrollToBottom();
        }
      });

    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) {
        setState(() => _isLoadingHistory = false);
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    }
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _chatService.sendMessage('message', {'matchId': widget.matchId, 'body': text});
    apiService.sendMessage(matchId: widget.matchId, body: text).then((sentMessage) {
      if (!_messages.any((m) => m['id'] == sentMessage['id'])) {
         setState(() => _messages.insert(0, sentMessage));
         _scrollToBottom();
      }
    }).catchError((e) {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('메시지 전송 실패: $e')));
    });
    _messageController.clear();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(0.0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _chatService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final matchDetails = ref.watch(matchDetailsProvider(widget.matchId));

    return Scaffold(
      appBar: AppBar(
        title: matchDetails.when(
          data: (details) => Text(details['matchedUser']?['display_name'] ?? '채팅'),
          loading: () => const Text('...'),
          error: (e, s) => const Text('채팅'),
        ),
      ),
      body: Column(
        children: [
          if (_showThreeQuestionWidget)
            _ThreeQuestionWidget(
              matchId: widget.matchId,
              onCompleted: () => setState(() => _showThreeQuestionWidget = false),
            ),
          Expanded(
            child: _isLoadingHistory
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isMine = message['sender_id'] == _currentUserId;
                      return _ChatBubble(message: message, isMine: isMine);
                    },
                  ),
          ),
          _MessageInputField(controller: _messageController, onSend: _sendMessage),
        ],
      ),
    );
  }
}

class _ThreeQuestionWidget extends StatefulWidget {
  final String matchId;
  final VoidCallback onCompleted;
  const _ThreeQuestionWidget({required this.matchId, required this.onCompleted});

  @override
  State<_ThreeQuestionWidget> createState() => _ThreeQuestionWidgetState();
}

class _ThreeQuestionWidgetState extends State<_ThreeQuestionWidget> {
  bool _isLoading = false;
  final _questions = ['가장 좋아하는 영화는?', '주말에 주로 뭐하세요?', '가보고 싶은 여행지는?'];
  late final _controllers = List.generate(3, (_) => TextEditingController());

  Future<void> _submitAnswers() async {
    setState(() => _isLoading = true);
    try {
      final answers = {
        for (int i = 0; i < _questions.length; i++) 
          _questions[i]: _controllers[i].text
      };
      await apiService.postInitialAnswers(widget.matchId, answers);
      widget.onCompleted();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('답변 제출 실패: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('매칭 성공! 3문 3답으로 대화를 시작해보세요.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          ...List.generate(_questions.length, (i) => Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: TextField(controller: _controllers[i], decoration: InputDecoration(labelText: _questions[i], border: const OutlineInputBorder())),
          )),
          const SizedBox(height: 8),
          ElevatedButton(onPressed: _isLoading ? null : _submitAnswers, child: _isLoading ? const CircularProgressIndicator() : const Text('답변 보내기')),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final dynamic message;
  final bool isMine;
  const _ChatBubble({required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMine ? theme.colorScheme.primary : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          message['body'] ?? '',
          style: TextStyle(color: isMine ? Colors.white : theme.textTheme.bodyLarge?.color),
        ),
      ),
    );
  }
}

class _MessageInputField extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  const _MessageInputField({required this.controller, required this.onSend});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      decoration: BoxDecoration(color: theme.cardColor, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, -2))]),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                decoration: const InputDecoration(hintText: '메시지 입력...', border: InputBorder.none, contentPadding: EdgeInsets.all(16)),
                onSubmitted: (_) => onSend(),
              ),
            ),
            IconButton(icon: Icon(Icons.send, color: theme.colorScheme.primary), onPressed: onSend),
          ],
        ),
      ),
    );
  }
}
