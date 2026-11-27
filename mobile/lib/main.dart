import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

const apiBase = 'https://wine-ai-1.vercel.app';
const storage = FlutterSecureStorage();

void main() => runApp(const WineApp());

class WineApp extends StatelessWidget {
  const WineApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'WINE AI',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF101010),
      colorScheme: const ColorScheme.dark(primary: Color(0xFF8E263B), secondary: Color(0xFFC0C0C0)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: const Color(0xFF1D1D1D),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      ),
      useMaterial3: true,
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
  @override Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return token == null ? LoginPage(onLogin: (t) async { await storage.write(key: 'wine_token', value: t); if(mounted) setState(() => token=t); }) :
      ChatPage(token: token!, onLogout: () async { await storage.delete(key: 'wine_token'); if(mounted) setState(() => token=null); });
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
    setState(() { busy=true; error=''; });
    try {
      final r = await http.post(Uri.parse('$apiBase/api/auth'),
        headers: {'Content-Type':'application/json'},
        body: jsonEncode({'action': signup ? 'signup':'login', 'email':email.text.trim(), 'password':password.text}));
      final d = jsonDecode(r.body);
      if (r.statusCode < 200 || r.statusCode >= 300 || d['token']==null) throw Exception(d['error'] ?? 'تعذر تسجيل الدخول');
      widget.onLogin(d['token'] as String);
    } catch(e) { setState(() => error=e.toString().replaceFirst('Exception: ','')); }
    finally { if(mounted) setState(() => busy=false); }
  }
  @override Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Icon(Icons.auto_awesome, size: 58, color: Color(0xFFC0C0C0)),
        const SizedBox(height:18), const Text('WINE AI', textAlign: TextAlign.center, style: TextStyle(fontSize:32,fontWeight:FontWeight.bold,letterSpacing:3)),
        const SizedBox(height:8), Text(signup ? 'أنشئ حسابك وابدأ تجربتك' : 'سجّل دخولك للمتابعة', textAlign: TextAlign.center, style: const TextStyle(color:Colors.white60)),
        const SizedBox(height:32), TextField(controller:email, keyboardType:TextInputType.emailAddress, decoration:const InputDecoration(labelText:'البريد الإلكتروني', prefixIcon:Icon(Icons.email_outlined))),
        const SizedBox(height:14), TextField(controller:password, obscureText:obscure, decoration:InputDecoration(labelText:'كلمة المرور',prefixIcon:const Icon(Icons.lock_outline),suffixIcon:IconButton(icon:Icon(obscure?Icons.visibility:Icons.visibility_off),onPressed:()=>setState(()=>obscure=!obscure)))),
        if(error.isNotEmpty) Padding(padding:const EdgeInsets.only(top:12),child:Text(error,style:const TextStyle(color:Colors.redAccent))),
        const SizedBox(height:22), FilledButton(onPressed:busy?null:submit, child:Padding(padding:const EdgeInsets.all(13),child:Text(busy?'جارٍ التنفيذ...':signup?'إنشاء حساب':'تسجيل الدخول'))),
        TextButton(onPressed:busy?null:()=>setState(()=>signup=!signup), child:Text(signup?'لديك حساب؟ سجّل الدخول':'ليس لديك حساب؟ أنشئ حساباً')),
      ]),
    )))),
  );
}

class ChatPage extends StatefulWidget {
  final String token; final VoidCallback onLogout;
  const ChatPage({super.key, required this.token, required this.onLogout});
  @override State<ChatPage> createState() => _ChatPageState();
}
class _ChatPageState extends State<ChatPage> {
  final input=TextEditingController(); final scroll=ScrollController();
  final messages=<Map<String,String>>[]; bool busy=false;
  Future<void> send() async {
    final prompt=input.text.trim(); if(prompt.isEmpty||busy)return;
    input.clear(); setState(() { messages.add({'role':'user','text':prompt}); busy=true; });
    try {
      final history=messages.length>1 ? messages.sublist(0,messages.length-1).map((m)=>'${m['role']=='user'?'المستخدم':'WINE AI'}: ${m['text']}').join('\n') : '';
      final r=await http.post(Uri.parse('$apiBase/api/chat'), headers:{'Content-Type':'application/json','X-User-Token':'Bearer ${widget.token}'}, body:jsonEncode({'prompt':prompt,'history':history}));
      final d=jsonDecode(r.body);
      if(r.statusCode<200||r.statusCode>=300) throw Exception(d['error']??'تعذر الحصول على رد');
      final answer=(d['reply']??d['response']??d['text']??'تم استلام الرد').toString();
      setState(()=>messages.add({'role':'assistant','text':answer}));
    } catch(e) { setState(()=>messages.add({'role':'assistant','text':'حدث خطأ: ${e.toString().replaceFirst('Exception: ','')}'})); }
    finally { if(mounted)setState(()=>busy=false); }
  }
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:const Text('WINE AI',style:TextStyle(letterSpacing:2,fontWeight:FontWeight.bold)),actions:[IconButton(onPressed:widget.onLogout,tooltip:'تسجيل الخروج',icon:const Icon(Icons.logout))]),
    body:Column(children:[
      Expanded(child:messages.isEmpty?const Center(child:Column(mainAxisSize:MainAxisSize.min,children:[Icon(Icons.auto_awesome,size:48,color:Colors.white38),SizedBox(height:12),Text('أهلاً بك في WINE AI'),Text('اكتب رسالتك وابدأ المحادثة',style:TextStyle(color:Colors.white54))])):ListView.builder(controller:scroll,padding:const EdgeInsets.all(16),itemCount:messages.length,itemBuilder:(c,i){final m=messages[i];final user=m['role']=='user';return Align(alignment:user?Alignment.centerRight:Alignment.centerLeft,child:Container(margin:const EdgeInsets.symmetric(vertical:6),padding:const EdgeInsets.all(14),constraints:const BoxConstraints(maxWidth:320),decoration:BoxDecoration(color:user?const Color(0xFF642033):const Color(0xFF252525),borderRadius:BorderRadius.circular(16)),child:Text(m['text']??'')));})),
      if(busy) const Padding(padding:EdgeInsets.all(8),child:Text('WINE AI يفكر...',style:TextStyle(color:Colors.white54))),
      SafeArea(top:false,child:Padding(padding:const EdgeInsets.fromLTRB(12,8,12,12),child:Row(children:[Expanded(child:TextField(controller:input,minLines:1,maxLines:5,onSubmitted:(_)=>send(),decoration:const InputDecoration(hintText:'اكتب رسالتك هنا...',contentPadding:EdgeInsets.symmetric(horizontal:16,vertical:12)))),const SizedBox(width:8),IconButton.filled(onPressed:busy?null:send,icon:const Icon(Icons.send))])))
    ]),
  );
}
