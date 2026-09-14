// TEST ONLY. No product references. Windows public handle APIs; no path enumeration.
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Win32.SafeHandles;

class DirectoryHandleHelper {
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern SafeFileHandle CreateFileW(string p,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool GetFileInformationByHandleEx(SafeFileHandle h,int cls,IntPtr buffer,uint size);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern uint GetFinalPathNameByHandleW(SafeFileHandle h,StringBuilder b,uint size,uint flags);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern uint GetDriveTypeW(string root);
    [DllImport("kernel32.dll")] static extern bool IsWow64Process2(IntPtr process,out ushort machine,out ushort nativeMachine);
    [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
    const uint Directory=16, Hidden=2, SystemItem=4, Reparse=1024;
    const int BufferSize=608; // One maximal name plus fixed header, not a whole directory.
    static JavaScriptSerializer json=new JavaScriptSerializer { MaxJsonLength=16384, RecursionLimit=8 };
    static volatile bool cancelled=false, protocolBad=false;
    static AutoResetEvent resume=new AutoResetEvent(false);
    static Stopwatch clock=Stopwatch.StartNew();
    static string probe="none", query, arch="unknown";
    static int scanned=0,visited=0,opened=0,peak=0;
    static bool truncated=false;
    static List<Dictionary<string,object>> results=new List<Dictionary<string,object>>();
    sealed class Failure:Exception { public string Category; public Failure(string c){Category=c;} }
    struct Identity { public long Volume,Low,High; }
    static object Counts(){return new {scannedEntries=scanned,visitedDirectories=visited,openHandles=opened,peakHandles=peak};}
    static void Emit(object o){string s=json.Serialize(o); if(Encoding.UTF8.GetByteCount(s)>16384)throw new Failure("payload_rejected"); Console.WriteLine(s);Console.Out.Flush();}
    static string Line(int limit){var b=new StringBuilder(); for(;;){int c=Console.In.Read();if(c<0)return b.Length==0?null:b.ToString();if(c==10)return b.ToString();if(c==13)continue;if(b.Length>=limit)throw new Failure("protocol_rejected");b.Append((char)c);}}
    static void Check(){if(protocolBad)throw new Failure("protocol_rejected");if(cancelled)throw new Failure("cancelled");if(clock.ElapsedMilliseconds>=3000)throw new Failure("timed_out");}
    static void Checkpoint(string point){
        if(probe!=point && probe!="all")return;
        Emit(new {kind="checkpoint",classification=point,counts=Counts()});
        if(point=="uncooperative" || point=="stuck")Thread.Sleep(Timeout.Infinite);
        while(!resume.WaitOne(10))Check();Check();
    }
    static IntPtr Info(SafeFileHandle h,int cls,int size){IntPtr p=Marshal.AllocHGlobal(size);if(!GetFileInformationByHandleEx(h,cls,p,(uint)size)){Marshal.FreeHGlobal(p);throw new Failure("identity_untrusted");}return p;}
    static Identity Id(SafeFileHandle h){IntPtr p=Info(h,18,24);try{return new Identity{Volume=Marshal.ReadInt64(p),Low=Marshal.ReadInt64(p,8),High=Marshal.ReadInt64(p,16)};}finally{Marshal.FreeHGlobal(p);}}
    static uint Attr(SafeFileHandle h){IntPtr p=Info(h,9,8);try{return (uint)Marshal.ReadInt32(p);}finally{Marshal.FreeHGlobal(p);}}
    static bool Same(Identity a,Identity b){return a.Volume==b.Volume&&a.Low==b.Low&&a.High==b.High;}
    static SafeFileHandle Open(string path,bool directory){
        Check(); // FILE_LIST_DIRECTORY for directories; FILE_READ_ATTRIBUTES only for files.
        SafeFileHandle h=CreateFileW(path,directory?0x81u:0x80u,7,IntPtr.Zero,3,0x02200000,IntPtr.Zero);
        if(h.IsInvalid){h.Dispose();throw new Failure("identity_untrusted");}
        opened++;peak=Math.Max(peak,opened);return h;
    }
    static void Close(SafeFileHandle h){h.Dispose();opened--;}
    static string HandlePath(SafeFileHandle h){var b=new StringBuilder(4096);uint n=GetFinalPathNameByHandleW(h,b,4096,0);if(n==0||n>=4096)throw new Failure("identity_untrusted");return b.ToString();}
    static bool NameSafe(string s,int max){if(s.Length==0||s.Length>max||s=="."||s=="..")return false;foreach(char c in s)if(char.IsControl(c)||c==':'||c=='/'||c=='\\')return false;return true;}
    static void Add(string name,string relative,bool dir){
        if(name.IndexOf(query,StringComparison.OrdinalIgnoreCase)<0)return;
        var r=new Dictionary<string,object>{{"name",name},{"relativePath",relative},{"entryType",dir?"directory":"file"}};
        results.Add(r);results.Sort((a,b)=>StringComparer.Ordinal.Compare((string)a["relativePath"],(string)b["relativePath"]));
        if(results.Count>20){truncated=true;results.RemoveAt(20);}
        if(Encoding.UTF8.GetByteCount(json.Serialize(results))>15000)throw new Failure("payload_rejected");
    }
    static void Walk(SafeFileHandle h,Identity parent,string relative,int depth){
        Check();if(visited>=256)throw new Failure("directory_limit");visited++;
        IntPtr buffer=Marshal.AllocHGlobal(BufferSize);
        try {
            bool first=true;
            for(;;){
                Check();if(!GetFileInformationByHandleEx(h,first?20:19,buffer,BufferSize)){
                    if(Marshal.GetLastWin32Error()==18)break;throw new Failure("identity_untrusted");
                }first=false;
                int offset=0;
                for(;;){
                    Check();if(offset<0||offset>BufferSize-88)throw new Failure("identity_untrusted");
                    IntPtr p=IntPtr.Add(buffer,offset);int next=Marshal.ReadInt32(p),len=Marshal.ReadInt32(p,60);
                    if(len<2||len>510||(len&1)!=0||offset+88+len>BufferSize)throw new Failure("entry_rejected");
                    string name=Marshal.PtrToStringUni(IntPtr.Add(p,88),len/2);
                    if(name!="."&&name!=".."){
                        if(scanned>=2000)throw new Failure("entry_limit");scanned++;
                        Checkpoint("during_enumeration");
                        uint attr=(uint)Marshal.ReadInt32(p,56);
                        if((attr&(Hidden|SystemItem|Reparse))==0){
                            if(!NameSafe(name,255))throw new Failure("entry_rejected");
                            string rel=relative.Length==0?name:relative+"/"+name;
                            if(rel.Length>512)throw new Failure("path_limit");
                            bool dir=(attr&Directory)!=0;
                            Identity expected=new Identity{Volume=parent.Volume,Low=Marshal.ReadInt64(p,72),High=Marshal.ReadInt64(p,80)};
                            Checkpoint("before_child_open");
                            SafeFileHandle child=Open(HandlePath(h)+"\\"+name,dir);
                            try {
                                uint actual=Attr(child);
                                if((actual&(Reparse|Hidden|SystemItem))!=0||((actual&Directory)!=0)!=dir||!Same(expected,Id(child)))throw new Failure("identity_untrusted");
                                Checkpoint("after_child_open");
                                if(!dir||depth<4)Add(name,rel,dir);
                                if(dir){if(depth<4)Walk(child,expected,rel,depth+1);else truncated=true;}
                            }finally{Close(child);}
                        }
                    }
                    if(next==0)break;if(next<88||(next&7)!=0||offset+next<=offset)throw new Failure("identity_untrusted");offset+=next;
                }
            }
        }finally{Marshal.FreeHGlobal(buffer);}
    }
    static string ValidateRoot(string root){
        if(root==null||root.Length>2048||root.Length<4||root[1]!=':'||root[2]!='\\'||!char.IsLetter(root[0])||root.StartsWith("\\")||root.IndexOf(':',2)>=0)throw new Failure("root_rejected");
        string full=Path.GetFullPath(root);if(full.TrimEnd('\\').Length<=2||GetDriveTypeW(full.Substring(0,3))!=3)throw new Failure("root_rejected");
        string fixture=Environment.GetEnvironmentVariable("SPIKE_FIXTURE");
        // Additional TEST-ONLY provenance gate, not the object-identity security proof.
        if(string.IsNullOrEmpty(fixture)||!full.StartsWith(fixture.TrimEnd('\\')+"\\",StringComparison.OrdinalIgnoreCase))throw new Failure("root_rejected");
        return full;
    }
    static void StrictObject(string line){
        if(line==null)throw new Failure("protocol_rejected");
        string atom="\\\"(?:[^\\\"\\\\\\x00-\\x1f]|\\\\(?:[\\\"\\\\/bfnrt]|u[0-9a-fA-F]{4}))*\\\"";
        string pair="\\\"(?<key>kind|root|query|maxResults|probe)\\\"\\s*:\\s*(?:"+atom+"|-?(?:0|[1-9][0-9]*))";
        Match m=Regex.Match(line,"\\A\\s*\\{\\s*"+pair+"(?:\\s*,\\s*"+pair+"){4}\\s*\\}\\s*\\z",RegexOptions.CultureInvariant);
        var seen=new HashSet<string>();
        if(!m.Success)throw new Failure("protocol_rejected");
        foreach(Capture k in m.Groups["key"].Captures)if(!seen.Add(k.Value))throw new Failure("protocol_rejected");
        if(seen.Count!=5)throw new Failure("protocol_rejected");
    }
    static void Main(){
        Console.InputEncoding=new UTF8Encoding(false);Console.OutputEncoding=new UTF8Encoding(false);
        string status="completed";
        try {
            ushort m,n;if(!IsWow64Process2(GetCurrentProcess(),out m,out n))throw new Failure("architecture_unavailable");
            // Process-machine UNKNOWN alone did not establish managed runtime architecture.
            // Cross-check actual CLR ProcessArchitecture, not PE target or pointer size.
            string runtime=System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString();
            if(runtime=="X64")arch=n==0xaa64?"x64_on_arm64_emulation":"x64_native";else if(runtime=="Arm64"&&n==0xaa64)arch="arm64_native";else arch="unknown";
            string line=Line(4096);StrictObject(line);var d=json.Deserialize<Dictionary<string,object>>(line);
            if(d==null||d.Count!=5||!d.ContainsKey("root")||!d.ContainsKey("query")||!d.ContainsKey("maxResults")||!d.ContainsKey("probe")||!d.ContainsKey("kind")||!(d["kind"] is string)||(string)d["kind"]!="search"||!(d["maxResults"] is int)||(int)d["maxResults"]!=20||!(d["root"] is string)||!(d["query"] is string)||!(d["probe"] is string))throw new Failure("protocol_rejected");
            query=(string)d["query"];probe=(string)d["probe"];
            if(query.Length<1||query.Length>120||query.Trim().Length==0)throw new Failure("protocol_rejected");
            foreach(char c in query)if(char.IsControl(c)||"\\/:*?[]{}()|^$".IndexOf(c)>=0)throw new Failure("protocol_rejected");
            if(Array.IndexOf(new[]{"none","all","before_enumeration","after_root_open","before_child_open","after_child_open","during_enumeration","after_result","uncooperative","stuck","abnormal","bad_protocol"},probe)<0)throw new Failure("protocol_rejected");
            string root=ValidateRoot((string)d["root"]);
            new Thread(()=>{try{string s;while((s=Line(64))!=null){if(s=="cancel"){cancelled=true;resume.Set();}else if(s=="continue")resume.Set();else{protocolBad=true;resume.Set();}}}catch{protocolBad=true;resume.Set();}}){IsBackground=true}.Start();
            Emit(new{kind="ready",classification=arch});
            if(probe=="abnormal")Environment.Exit(7);
            if(probe=="bad_protocol"){Console.WriteLine("{\"kind\":\"invalid\"}");return;}
            Checkpoint("before_enumeration");
            SafeFileHandle handle=Open(root,true);
            try{
                uint a=Attr(handle);if((a&Directory)==0||(a&(Reparse|Hidden|SystemItem))!=0)throw new Failure("root_rejected");
                Identity identity=Id(handle);Checkpoint("after_root_open");Checkpoint("uncooperative");Checkpoint("stuck");
                Walk(handle,identity,"",0);
            }finally{Close(handle);}
            Checkpoint("after_result");Check();
        }catch(Failure f){status=f.Category;results.Clear();}catch{status="internal_unavailable";results.Clear();}
        try{Emit(new{kind="result",classification=status,architecture=arch,matches=results,truncated=status=="completed"&&truncated,counts=Counts()});}catch{Console.WriteLine("{\"kind\":\"failure\",\"classification\":\"payload_rejected\"}");}
    }
}
