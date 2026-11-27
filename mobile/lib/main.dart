import 'dart:convert';
import 'dart:math';
// ignore: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

const apiBase = 'https://wine-ai-1.vercel.app';
const storage = FlutterSecureStorage();
const wineRed = Color(0xFF8E263B);
const panel = Color(0xFF1D1D1D);

void main() => runApp(const WineApp());

class WineApp extends StatelessWidget {
  const WineApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'WINE AI', debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark, scaffoldBackgroundColor: const Color(0xFF101010),
      colorScheme: const ColorScheme.dark(primary: wineRed, secondary: Color(0xFFC0C0C0)),
      useMaterial3: true,
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: panel,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
      ),
    ),
    home: const AuthGate(),
  );
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override State<AuthGate> createState() => _AuthGateState();
}
class _AuthGateState extends State<AuthGate> {
  String? token;
  bool loading = true;
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    token = await storage.read(key: 'wine_token');
    if (mounted) setState(() => loading = false);
  }
  Future<void> _login(String value) async {
    await storage.write(key: 'wine_token', value: value);
    if (mounted) setState(() => token = value);
  }
  Future<void> _logout() async {
    await storage.delete(key: 'wine_token');
    if (mounted) setState(() => token = null);
  }
  @override Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return token == null ? LoginPage(onLogin: _login) : ChatPage(token: token!, onLogout: _logout);
  }
}

class LoginPage extends StatefulWidget {
  final ValueChanged<String> onLogin;
  const LoginPage({super.key, required this.onLogin});
  @override State<LoginPage> createState() => _LoginPageState();
}
class _LoginPageState extends State<LoginPage> {
  final email = TextEditingController(), password = TextEditingController();
  bool signup = false, busy = false, obscure = true;
  String error = '';
  Future<void> submit() async {
    if (email.text.trim().isEmpty || password.text.isEmpty) {
      setState(() => error = 'اكتب البريد الإلكتروني وكلمة المرور أولاً.'); return;
    }
    setState(() { busy = true; error = ''; });
    try {
      final r = await http.post(Uri.parse('$apiBase/api/auth'),
        headers: {'Content-Type':'application/json'},
        body: jsonEncode({'action': signup ? 'signup' : 'login', 'email':email.text.trim(), 'password':password.text}));
      final d = jsonDecode(r.body);
      if (r.statusCode < 200 || r.statusCode >= 300 || d['token'] == null) {
        throw Exception(d['error'] ?? 'تعذر تسجيل الدخول.');
      }
      widget.onLogin(d['token'] as String);
    } catch (e) {
      if (mounted) setState(() => error = e.toString().replaceFirst('Exception: ', ''));
    } finally { if (mounted) setState(() => busy = false); }
  }
  @override Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: Center(child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440), child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Icon(Icons.auto_awesome, size: 64, color: Color(0xFFC0C0C0)),
          const SizedBox(height: 18),
          const Text('WINE AI', textAlign: TextAlign.center, style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 3)),
          const SizedBox(height: 8),
          Text(signup ? 'أنشئ حسابك واحتفظ بمحادثاتك' : 'مرحباً بعودتك', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white60)),
          const SizedBox(height: 32),
          TextField(controller: email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], decoration: const InputDecoration(labelText: 'البريد الإلكتروني', prefixIcon: Icon(Icons.email_outlined))),
          const SizedBox(height: 14),
          TextField(controller: password, obscureText: obscure, autofillHints: [signup ? AutofillHints.newPassword : AutofillHints.password], decoration: InputDecoration(labelText: 'كلمة المرور', prefixIcon: const Icon(Icons.lock_outline), suffixIcon: IconButton(icon: Icon(obscure ? Icons.visibility : Icons.visibility_off), onPressed: () => setState(() => obscure = !obscure)))),
          if (signup) const Padding(padding: EdgeInsets.only(top: 8), child: Text('كلمة المرور يجب ألا تقل عن 6 أحرف.', style: TextStyle(color: Colors.white54, fontSize: 12))),
          if (error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error, style: const TextStyle(color: Colors.redAccent))),
          const SizedBox(height: 22),
          FilledButton(onPressed: busy ? null : submit, child: Padding(padding: const EdgeInsets.all(13), child: Text(busy ? 'جارٍ التنفيذ...' : signup ? 'إنشاء حساب' : 'تسجيل الدخول'))),
          TextButton(onPressed: busy ? null : () => setState(() { signup = !signup; error = ''; }), child: Text(signup ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً')),
          const SizedBox(height: 20),
          const Text('WINE FOR MORE THING’S', textAlign: TextAlign.center, style: TextStyle(color: Colors.white30, letterSpacing: 1.4, fontSize: 11)),
        ],
      )),
    ))),
  );
}

class ChatPage extends StatefulWidget {
  final String token;
  final VoidCallback onLogout;
  const ChatPage({super.key, required this.token, required this.onLogout});
  @override State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  final input = TextEditingController();
  final scroll = ScrollController();
  final messages = <Map<String, dynamic>>[];
  final conversations = <Map<String, dynamic>>[];
  String? activeId, sessionId, email;
  bool busy = false, loadingHistory = true;

  Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-User-Token': 'Bearer ${widget.token}',
  };

  String newId() => '${DateTime.now().microsecondsSinceEpoch}_${Random.secure().nextInt(999999)}';

  @override void initState() { super.initState(); _loadConversations(); }

  Future<Map<String, dynamic>> apiGet(String path) async {
    final r = await http.get(Uri.parse('$apiBase$path'), headers: headers);
    final d = jsonDecode(r.body) as Map<String, dynamic>;
    if (r.statusCode < 200 || r.statusCode >= 300) throw Exception(d['error'] ?? 'حدث خطأ في الاتصال.');
    return d;
  }

  Future<void> _loadConversations() async {
    try {
      final d = await apiGet('/api/auth');
      if (!mounted) return;
      setState(() {
        email = d['profile']?['email']?.toString();
        conversations
          ..clear()
          ..addAll((d['conversations'] as List? ?? []).whereType<Map>().map((e) => Map<String, dynamic>.from(e)));
      });
    } catch (e) {
      if (mounted) _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally { if (mounted) setState(() => loadingHistory = false); }
  }

  Future<void> _saveConversation() async {
    if (activeId == null) return;
    final safe = messages.where((m) => m['text'] is String).map((m) => {'role':m['role'], 'text':m['text']}).toList().reversed.take(100).toList().reversed.toList();
    try {
      await http.post(Uri.parse('$apiBase/api/auth'), headers: headers, body: jsonEncode({
        'action': 'saveConversation', 'id': activeId, 'title': _title, 'sessionId': sessionId, 'messages': safe,
      }));
      await _loadConversations();
    } catch (e) { _snack('لم يتم حفظ المحادثة: ${e.toString().replaceFirst('Exception: ', '')}'); }
  }

  String get _title {
    Map<String, dynamic>? first;
    for (final item in messages) { if (item['role'] == 'user') { first = item; break; } }
    final value = first?['text']?.toString() ?? 'محادثة جديدة';
    return value.length > 48 ? '${value.substring(0, 48)}…' : value;
  }

  Future<void> _newChat() async {
    if (busy) return;
    setState(() { activeId = newId(); sessionId = null; messages.clear(); });
    scaffoldKey.currentState?.closeDrawer();
  }

  Future<void> _openConversation(String id) async {
    if (busy) return;
    try {
      final d = await apiGet('/api/auth?id=${Uri.encodeQueryComponent(id)}');
      final c = Map<String, dynamic>.from(d['conversation'] as Map);
      setState(() {
        activeId = id; sessionId = c['sessionId']?.toString(); messages
          ..clear()
          ..addAll((c['messages'] as List? ?? []).whereType<Map>().map((m) => <String,dynamic>{'role':m['role'], 'text':m['text']}));
      });
      if (mounted) scaffoldKey.currentState?.closeDrawer();
      _scrollDown();
    } catch (e) { _snack(e.toString().replaceFirst('Exception: ', '')); }
  }

  void _openWeb(String path, String title) {
    scaffoldKey.currentState?.closeDrawer();
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => WineWebPage(path: path, title: title)));
  }

  Future<void> _deleteConversation(String id) async {
    try {
      final r = await http.post(Uri.parse('$apiBase/api/auth'), headers: headers, body: jsonEncode({'action':'deleteConversation','id':id}));
      if (r.statusCode < 200 || r.statusCode >= 300) throw Exception('تعذر حذف المحادثة.');
      if (activeId == id) setState(() { activeId = null; sessionId = null; messages.clear(); });
      await _loadConversations();
    } catch (e) { _snack(e.toString().replaceFirst('Exception: ', '')); }
  }

  void _snack(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text), backgroundColor: const Color(0xFF333333)));
  }
  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (scroll.hasClients) scroll.animateTo(scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    });
  }

  Future<void> _send() async {
    final prompt = input.text.trim();
    if (prompt.isEmpty || busy) return;
    activeId ??= newId();
    input.clear();
    setState(() { messages.add({'role':'user','text':prompt}); busy = true; });
    _scrollDown();
    try {
      final history = messages.length > 1
        ? messages.sublist(0, messages.length - 1).take(20).map((m) => '${m['role'] == 'user' ? 'المستخدم' : 'WINE AI'}: ${m['text']}').join('\n')
        : '';
      final r = await http.post(Uri.parse('$apiBase/api/chat'), headers: headers, body: jsonEncode({
        'prompt': prompt, 'history': history, 'sessionId': sessionId,
      })).timeout(const Duration(seconds: 100));
      final d = jsonDecode(r.body) as Map<String, dynamic>;
      if (r.statusCode < 200 || r.statusCode >= 300) throw Exception(d['error'] ?? 'تعذر الحصول على رد.');
      final answer = (d['response'] ?? d['reply'] ?? d['text'] ?? '').toString().trim();
      if (answer.isEmpty) throw Exception('لم يصل رد من WINE AI.');
      setState(() { messages.add({'role':'assistant','text':answer}); sessionId = d['sessionId']?.toString() ?? sessionId; });
      await _saveConversation();
    } catch (e) {
      final error = 'تعذّر إكمال الطلب: ${e.toString().replaceFirst('Exception: ', '')}';
      setState(() => messages.add({'role':'assistant','text':error}));
      await _saveConversation();
    } finally { if (mounted) { setState(() => busy = false); _scrollDown(); } }
  }

  Future<void> _generateImage() async {
    final prompt = input.text.trim();
    if (prompt.isEmpty || busy) return;
    if (activeId == null) activeId = newId();
    input.clear();
    setState(() { messages.add({'role':'user','text':'أنشئ صورة: $prompt'}); busy = true; });
    _scrollDown();
    try {
      final r = await http.post(Uri.parse('$apiBase/api/star-x-image'), headers: headers, body: jsonEncode({'prompt':prompt})).timeout(const Duration(seconds: 130));
      if (r.statusCode < 200 || r.statusCode >= 300) {
        String message = 'تعذر توليد الصورة.';
        try { message = (jsonDecode(r.body) as Map)['error']?.toString() ?? message; } catch (_) { /* Ignore malformed error payload and use the fallback message. */ }
        throw Exception(message);
      }
      if (!(r.headers['content-type'] ?? '').startsWith('image/')) throw Exception('استجابة الصورة غير صالحة.');
      setState(() => messages.add({'role':'assistant','text':'تم إنشاء الصورة لهذا الوصف: $prompt','image':Uint8List.fromList(r.bodyBytes)}));
      await _saveConversation();
    } catch (e) {
      setState(() => messages.add({'role':'assistant','text':'تعذر إنشاء الصورة: ${e.toString().replaceFirst('Exception: ', '')}'}));
      await _saveConversation();
    } finally { if (mounted) { setState(() => busy = false); _scrollDown(); } }
  }

  Widget _message(Map<String, dynamic> m) {
    final user = m['role'] == 'user';
    return Align(
      alignment: user ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 7),
        padding: const EdgeInsets.all(13),
        constraints: const BoxConstraints(maxWidth: 340),
        decoration: BoxDecoration(color: user ? const Color(0xFF642033) : panel, borderRadius: BorderRadius.circular(17)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (m['image'] is Uint8List) ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(m['image'] as Uint8List, fit: BoxFit.contain)),
          if (m['text'] != null)
            user ? SelectableText(m['text'].toString()) : MarkdownBody(data: m['text'].toString(), selectable: true, styleSheet: MarkdownStyleSheet(
              p: const TextStyle(color: Colors.white, height: 1.5),
              code: const TextStyle(color: Color(0xFFE4B5C0), backgroundColor: Color(0xFF111111)),
              codeblockDecoration: BoxDecoration(color: const Color(0xFF111111), borderRadius: BorderRadius.circular(10)),
              h1: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
              h2: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold),
              blockquote: const TextStyle(color: Colors.white70),
            )),
          if (!user && m['text'] != null) Align(alignment: Alignment.centerLeft, child: IconButton(
            visualDensity: VisualDensity.compact, tooltip: 'نسخ الرد', icon: const Icon(Icons.copy, size: 16, color: Colors.white54),
            onPressed: () { _copy(m['text'].toString()); },
          )),
        ]),
      ),
    );
  }

  Future<void> _copy(String text) async {
    // Selectable text remains available even when clipboard access is restricted.
    await Clipboard.setData(ClipboardData(text: text));
    _snack('تم نسخ النص.');
  }

  @override Widget build(BuildContext context) => Scaffold(
    key: scaffoldKey,
    drawer: Drawer(
      backgroundColor: const Color(0xFF171717),
      child: SafeArea(child: Column(children: [
        Container(width: double.infinity, padding: const EdgeInsets.fromLTRB(20, 25, 20, 20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.auto_awesome, size: 36, color: Color(0xFFC0C0C0)),
          const SizedBox(height: 12),
          const Text('WINE AI', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 5),
          Text(email ?? 'حسابك', style: const TextStyle(color: Colors.white54)),
        ])),
        const Divider(color: Colors.white12),
        ListTile(leading: const Icon(Icons.add_comment_outlined), title: const Text('محادثة جديدة'), onTap: _newChat),
        ListTile(leading: const Icon(Icons.grid_view_rounded), title: const Text('مركز الأدوات'), subtitle: const Text('CODE · WRITE · LIBRARY · GALLERY'), onTap: () => _openWeb('/features', 'مركز الأدوات')),
        ListTile(leading: const Icon(Icons.public), title: const Text('موقع WINE AI'), onTap: () => _openWeb('/', 'موقع WINE AI')),
        ListTile(leading: const Icon(Icons.info_outline), title: const Text('عن WINE AI'), onTap: () => _openWeb('/about.html', 'عن WINE AI')),
        ListTile(leading: const Icon(Icons.support_agent), title: const Text('الشكاوى والمقترحات'), onTap: () => _openWeb('/complaints', 'الشكاوى والمقترحات')),
        const Padding(padding: EdgeInsets.fromLTRB(18, 14, 18, 8), child: Align(alignment: Alignment.centerRight, child: Text('محادثاتك المحفوظة', style: TextStyle(color: Colors.white54, fontSize: 12)))),
        Expanded(child: loadingHistory ? const Center(child: CircularProgressIndicator()) : conversations.isEmpty
          ? const Center(child: Text('لا توجد محادثات محفوظة بعد', style: TextStyle(color: Colors.white38)))
          : ListView.builder(itemCount: conversations.length, itemBuilder: (context, i) {
            final c = conversations[i];
            final id = c['id'].toString();
            return ListTile(
              selected: id == activeId, selectedTileColor: wineRed.withValues(alpha: .18),
              leading: const Icon(Icons.chat_bubble_outline, size: 19),
              title: Text(c['title']?.toString() ?? 'محادثة', maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: IconButton(icon: const Icon(Icons.delete_outline, size: 19, color: Colors.white54), onPressed: () => _deleteConversation(id)),
              onTap: () => _openConversation(id),
            );
          })),
        const Divider(color: Colors.white12),
        ListTile(leading: const Icon(Icons.logout), title: const Text('تسجيل الخروج'), onTap: widget.onLogout),
      ])),
    ),
    appBar: AppBar(
      title: const Text('WINE AI', style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold)),
      leading: IconButton(icon: const Icon(Icons.menu), onPressed: () => scaffoldKey.currentState?.openDrawer()),
      actions: [IconButton(tooltip: 'محادثة جديدة', onPressed: _newChat, icon: const Icon(Icons.add))],
    ),
    body: Column(children: [
      Expanded(child: messages.isEmpty
        ? Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.auto_awesome, size: 54, color: Colors.white38),
          const SizedBox(height: 16),
          const Text('أهلاً بك في WINE AI', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('اسأل، اكتب، أو اطلب إنشاء صورة.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
          const SizedBox(height: 22),
          Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
            _suggest('اكتب لي فكرة مشروع', 'اكتب لي فكرة مشروع تطبيق مميزة'),
            _suggest('اشرح لي البرمجة', 'اشرح لي أساسيات البرمجة للمبتدئين'),
          ]),
        ])))
        : ListView.builder(controller: scroll, padding: const EdgeInsets.fromLTRB(14, 12, 14, 20), itemCount: messages.length, itemBuilder: (c, i) => _message(messages[i]))),
      if (busy) const Padding(padding: EdgeInsets.only(bottom: 8), child: Text('WINE AI يعمل على طلبك...', style: TextStyle(color: Colors.white54, fontSize: 12))),
      SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(12, 6, 12, 12), child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(child: TextField(controller: input, minLines: 1, maxLines: 5, onSubmitted: (_) => _send(), decoration: const InputDecoration(hintText: 'اكتب رسالتك هنا...', contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 13)))),
        const SizedBox(width: 6),
        IconButton(tooltip: 'إنشاء صورة', onPressed: busy ? null : _generateImage, icon: const Icon(Icons.image_outlined, color: Color(0xFFC0C0C0))),
        IconButton.filled(tooltip: 'إرسال', onPressed: busy ? null : _send, icon: const Icon(Icons.send)),
      ]))),
    ]),
  );

  Widget _suggest(String label, String prompt) => ActionChip(label: Text(label), onPressed: () { input.text = prompt; _send(); });
}


class WineWebPage extends StatefulWidget {
  final String path;
  final String title;
  const WineWebPage({super.key, required this.path, required this.title});
  @override State<WineWebPage> createState() => _WineWebPageState();
}
class _WineWebPageState extends State<WineWebPage> {
  late final WebViewController controller;
  bool loading = true;
  @override void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) { if (mounted) setState(() => loading = false); },
        onWebResourceError: (_) { if (mounted) setState(() => loading = false); },
      ))
      ..loadRequest(Uri.parse('$apiBase${widget.path}'));
  }
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.title)),
    body: Stack(children: [
      WebViewWidget(controller: controller),
      if (loading) const LinearProgressIndicator(),
    ]),
  );
}
