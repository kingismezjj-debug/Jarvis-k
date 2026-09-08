// Test-only standalone helper. No Jarvis runtime, IPC, database, provider or executor reference.
using System;
using System.IO;
using System.IO.Pipes;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32.SafeHandles;

namespace RecoveryAuthorization {
 public static class Harness {
  internal const int Size=96;
  internal static readonly object OutputLock=new object();
  [StructLayout(LayoutKind.Sequential)] internal struct SA { public int length;public IntPtr descriptor;public int inherit; }
  [StructLayout(LayoutKind.Sequential)] internal struct PBI { public IntPtr reserved,peb,reserved2,reserved3,id,parent; }
  [DllImport("ntdll.dll")] static extern int NtQueryInformationProcess(IntPtr process,int kind,ref PBI info,int size,out int length);
  [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern SafePipeHandle CreateNamedPipe(string name,uint open,uint mode,uint instances,uint output,uint input,uint timeout,ref SA security);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetNamedPipeClientProcessId(SafePipeHandle pipe,out uint client);
  [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint access,out IntPtr token);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  [DllImport("user32.dll")] internal static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] internal static extern bool IsWindow(IntPtr window);
  [DllImport("user32.dll")] internal static extern bool ShowWindow(IntPtr window,int command);
  [DllImport("user32.dll")] internal static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr window,out uint owner);
  internal static int Parent(Process p){var b=new PBI();int n;if(NtQueryInformationProcess(p.Handle,0,ref b,Marshal.SizeOf(b),out n)!=0)throw new Exception();return b.parent.ToInt32();}
  static string Sid(Process p){IntPtr token;if(!OpenProcessToken(p.Handle,8,out token))throw new Exception();try{using(var i=new WindowsIdentity(token))return i.User.Value;}finally{CloseHandle(token);}}
  static string Image(Process p){return Path.GetFullPath(p.MainModule.FileName);}
  internal static bool ParentValid(Process self,Process parent){return !parent.HasExited&&Parent(self)==parent.Id&&self.SessionId==parent.SessionId&&
    parent.StartTime.ToUniversalTime()<=self.StartTime.ToUniversalTime()&&Sid(self)==Sid(parent)&&
    String.Equals(Path.GetFileName(Image(parent)),"node.exe",StringComparison.OrdinalIgnoreCase)&&
    String.Equals(Image(self),Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell\\v1.0\\powershell.exe"),StringComparison.OrdinalIgnoreCase);}
  internal static byte[] Read(Stream s){var b=new byte[Size];int n=0,k;while(n<Size){k=s.Read(b,n,Size-n);if(k==0)throw new EndOfStreamException();n+=k;}return b;}
  internal static async Task<byte[]> ReadAsync(Stream s){var b=new byte[Size];int n=0;while(n<Size){int k=await s.ReadAsync(b,n,Size-n);if(k==0)throw new EndOfStreamException();n+=k;}return b;}
  internal static bool Bound(byte[] b,byte[] init,char kind){if(b.Length!=Size||b[0]!=72||b[1]!=49||b[2]!=48||b[3]!=(byte)kind||b[4]!=1||b[5]!=66)return false;int diff=0;for(int n=8;n<56;n++)diff|=b[n]^init[n];return diff==0;}
  internal static bool Control(byte[] b){if(b[6]!=0||b[7]!=0)return false;for(int n=56;n<Size;n++)if(b[n]!=0)return false;return true;}
  internal static byte[] Frame(byte[] init,char kind,byte code){var b=new byte[Size];Array.Copy(init,b,56);b[3]=(byte)kind;b[6]=code;b[7]=0;return b;}
  internal static void Output(byte[] b){lock(OutputLock){var s=Console.OpenStandardOutput();s.Write(b,0,b.Length);s.Flush();}}
  internal static NamedPipeServerStream Pipe(byte[] init){
   var security=new PipeSecurity();security.SetAccessRuleProtection(true,false);
   security.AddAccessRule(new PipeAccessRule(WindowsIdentity.GetCurrent().User,PipeAccessRights.FullControl,AccessControlType.Allow));
   byte[] sd=security.GetSecurityDescriptorBinaryForm();var pin=GCHandle.Alloc(sd,GCHandleType.Pinned);
   try{var sa=new SA{length=Marshal.SizeOf(typeof(SA)),descriptor=pin.AddrOfPinnedObject(),inherit=0};
    // FIRST_PIPE_INSTANCE, OVERLAPPED, DUPLEX; REJECT_REMOTE_CLIENTS; one client only.
    var handle=CreateNamedPipe("\\\\.\\pipe\\jarvis-recovery-auth-"+BitConverter.ToString(init,40,16).Replace("-","").ToLowerInvariant(),0x40080003,8,1,Size*2,Size*2,0,ref sa);
    if(handle.IsInvalid)throw new IOException();return new NamedPipeServerStream(PipeDirection.InOut,true,false,handle);
   }finally{pin.Free();}
  }
  internal static bool Peer(NamedPipeServerStream pipe,Process parent){uint id;return GetNamedPipeClientProcessId(pipe.SafePipeHandle,out id)&&id==parent.Id&&!parent.HasExited&&Sid(parent)==WindowsIdentity.GetCurrent().User.Value;}
  internal static byte WindowFlags(IntPtr window,int expected){uint id;GetWindowThreadProcessId(window,out id);return (byte)((id==expected?1:0)|(window==GetForegroundWindow()?2:0)|(IsWindowVisible(window)?4:0));}
  internal static void ClickReceipt(byte[] p){var b=Frame(Startup,'V',0);Array.Copy(p,0,b,56,7);Output(b);}
  internal static void WindowPredicates(IntPtr window,int expected,byte[] p){
   p[1]=(byte)(IsWindow(window)?1:2);if(p[1]!=1){p[6]=1;return;}
   uint owner;uint thread=GetWindowThreadProcessId(window,out owner);p[2]=(byte)(thread!=0&&owner!=0?1:2);if(p[2]!=1){p[6]=1;return;}
   p[3]=(byte)(owner==expected?1:2);p[4]=(byte)(IsWindowVisible(window)?1:2);p[5]=(byte)(GetForegroundWindow()==window?1:2);p[6]=1;
  }
  public static void Verify(){
   var p=new byte[7];try{var b=Read(Console.OpenStandardInput());if(b[0]!=72||b[1]!=49||b[2]!=48||b[3]!=82||b[4]!=1||b[5]!=66)throw new Exception();
    using(var helper=Process.GetProcessById(BitConverter.ToInt32(b,56)))using(var parent=Process.GetProcessById(BitConverter.ToInt32(b,80)))using(var self=Process.GetCurrentProcess()){
     p[0]=2;
     if(!helper.HasExited&&ParentValid(helper,parent)&&ParentValid(self,parent)&&helper.StartTime.ToUniversalTime().Ticks==BitConverter.ToInt64(b,60)&&parent.StartTime.ToUniversalTime().Ticks==BitConverter.ToInt64(b,84)&&helper.SessionId==BitConverter.ToInt32(b,68)){
      p[0]=1;WindowPredicates(new IntPtr(BitConverter.ToInt64(b,72)),helper.Id,p);
     }else p[6]=1;
    }
   }catch{p[6]=3;}Console.OpenStandardOutput().Write(p,0,p.Length);
  }
  internal static byte[] Startup; internal static byte LastStage=7,Category=4; internal static bool StartupFailed; internal static int ExitStatus;
  internal static void Stage(byte value){LastStage=value;var b=Frame(Startup,'S',value);Output(b);}
  internal static void StartupFailure(byte category){if(StartupFailed)return;StartupFailed=true;var b=Frame(Startup,'S',LastStage);b[7]=category;try{Output(b);}catch{}}
  public static int Run(byte[] initial){
   Startup=initial;Category=4;
   try{
    Stage(8); Category=5;
    var init=initial;if(!Bound(init,init,'I')||init[6]!=0||init[7]!=0)throw new Exception();
    int budget=BitConverter.ToInt32(init,60);if(budget<1||budget>45000)throw new Exception();Stage(9);
    Category=6;
    using(var self=Process.GetCurrentProcess())using(var parent=Process.GetProcessById(BitConverter.ToInt32(init,56))){
     if(!ParentValid(self,parent))throw new Exception();Stage(10);Category=7;
     using(var pipe=Pipe(init)){
      Stage(11);Category=8;
      if(Thread.CurrentThread.GetApartmentState()!=ApartmentState.STA)throw new Exception();Stage(12);Category=9;
      // Classification exists before parameters/pipe/form; install UI handling before constructing controls.
      Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
      Application.ThreadException+=(sender,error)=>{StartupFailure(Category);ExitStatus=24;Application.ExitThread();};
      Application.EnableVisualStyles();Stage(13);Category=10;
      using(var form=new AuthorizationForm(init,self,parent,pipe,budget)){
       Stage(14);
       Task.Run(()=>{try{Console.OpenStandardInput().ReadByte();form.RequestAbort();}catch{form.RequestAbort();}});
       Category=11;Stage(15);Application.Run(form);
      }
     }
    }
    return ExitStatus;
   }catch{StartupFailure(Category);return Category==7?23:Category>=8&&Category<=12?24:Category>=5&&Category<=6?22:25;}
  }

 }
 internal sealed class AuthorizationForm:Form {
  const string Title="Jarvis 恢复测试授权——不是应用操作审批";
  const string Body="Jarvis窗口中的‘允许/拒绝’请勿点击。\n下面的按钮只授权测试工具关闭当前隔离测试实例，\n不会授权打开记事本或执行其他电脑操作。";
  readonly byte[] init;readonly Process self,parent;readonly NamedPipeServerStream pipe;readonly int budget;
  readonly Button allow=new Button(),cancel=new Button();readonly Stopwatch clock=Stopwatch.StartNew();
  readonly System.Windows.Forms.Timer timer=new System.Windows.Forms.Timer();
  readonly TaskCompletionSource<byte> choice=new TaskCompletionSource<byte>();int decided,aborted;bool finished;
  internal AuthorizationForm(byte[] i,Process s,Process p,NamedPipeServerStream stream,int ms){init=i;self=s;parent=p;pipe=stream;budget=ms;
   Text=Title;ClientSize=new Size(610,220);FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;MinimizeBox=false;StartPosition=FormStartPosition.Manual;
   var label=new Label{Text=Body,Location=new Point(24,25),Size=new Size(565,105),Font=new Font("Microsoft YaHei UI",11)};
   allow.Text="授权测试关闭";allow.SetBounds(250,155,155,40);allow.TabIndex=1;allow.Enabled=false;
   cancel.Text="取消测试";cancel.SetBounds(420,155,155,40);cancel.TabIndex=0;
   Controls.Add(label);Controls.Add(allow);Controls.Add(cancel);AcceptButton=null;CancelButton=null;
   allow.Click+=(o,e)=>Choose(1);cancel.Click+=(o,e)=>Choose(2);
   FormClosing+=(o,e)=>{if(!finished){e.Cancel=true;Choose(2);}};
   Shown+=(o,e)=>{BeginInvoke(new Action(()=>{
    var area=Screen.FromPoint(Cursor.Position).WorkingArea;Width=Math.Min(Width,area.Width);Height=Math.Min(Height,area.Height);
    Location=new Point(area.Left+(area.Width-Width)/2,area.Top+(area.Height-Height)/2);
    Visible=true;Harness.ShowWindow(Handle,1);Show();Activate();BringToFront();cancel.Focus();
    Harness.Stage(16);if(aborted!=0){Fail(16);return;}Harness.Category=12;Ready();Harness.Stage(17);Harness.Category=11;Transport();
   }));};
   timer.Interval=50;timer.Tick+=(o,e)=>{if(aborted!=0)Fail(16);else if(clock.ElapsedMilliseconds>=budget)Fail(2);else if(parent.HasExited)Fail(5);};timer.Start();
  }
  protected override bool ProcessCmdKey(ref Message msg,Keys key){if(key==Keys.Escape){Choose(2);return true;}
   if(key==Keys.Enter||key==Keys.Space){if(allow.Focused&&allow.Enabled)Choose(1);else if(cancel.Focused)Choose(2);return true;}return base.ProcessCmdKey(ref msg,key);}
  void Ready(){var b=Harness.Frame(init,'R',0);Array.Copy(BitConverter.GetBytes(self.Id),0,b,56,4);Array.Copy(BitConverter.GetBytes(self.StartTime.ToUniversalTime().Ticks),0,b,60,8);
   Array.Copy(BitConverter.GetBytes(self.SessionId),0,b,68,4);Array.Copy(BitConverter.GetBytes(Handle.ToInt64()),0,b,72,8);
   Array.Copy(BitConverter.GetBytes(parent.Id),0,b,80,4);Array.Copy(BitConverter.GetBytes(parent.StartTime.ToUniversalTime().Ticks),0,b,84,8);Harness.Output(b);}
  internal void RequestAbort(){Interlocked.Exchange(ref aborted,1);}
  void Choose(byte value){if(finished||Interlocked.CompareExchange(ref decided,1,0)!=0)return;
   if(clock.ElapsedMilliseconds>=budget){Fail(2);return;}if(aborted!=0){Fail(16);return;}
   if(value==1){var p=new byte[7];try{if(!Harness.ParentValid(self,parent)){p[0]=2;p[6]=1;Harness.ClickReceipt(p);Fail(3);return;}p[0]=1;Harness.WindowPredicates(Handle,self.Id,p);}catch{p[6]=3;Harness.ClickReceipt(p);Fail(25);return;}Harness.ClickReceipt(p);
    if(p[1]!=1){Fail(20);return;}if(p[2]!=1){Fail(21);return;}if(p[3]!=1){Fail(22);return;}if(p[4]!=1){Fail(23);return;}if(p[5]!=1){Fail(6);return;}}
   allow.Enabled=false;cancel.Enabled=false;if(value==2)Harness.ExitStatus=2;choice.TrySetResult(value);
  }
  async void Transport(){try{
   await pipe.WaitForConnectionAsync();if(finished)return;if(!Harness.Peer(pipe,parent)){Fail(3);return;}
   var hello=await Harness.ReadAsync(pipe);if(hello[5]!=66){Fail(10);return;}if(!Harness.Bound(hello,init,'H')){Fail(9);return;}if(!Harness.Control(hello)){Fail(8);return;}
   if(decided==0)allow.Enabled=true;
   byte value=await choice.Task;if(finished||aborted!=0)return;
   var decision=Harness.Frame(init,'M',value);if(value==1)decision[7]=Harness.WindowFlags(Handle,self.Id);
   await pipe.WriteAsync(decision,0,decision.Length);await pipe.FlushAsync();
   var ack=await Harness.ReadAsync(pipe);if(!Harness.Bound(ack,init,'A')||!Harness.Control(ack)){Fail(8);return;}
   Finish();
  }catch(EndOfStreamException){Fail(7);}catch{Fail(8);}}
  void Fail(byte code){if(finished)return;Harness.ExitStatus=code==2?3:code==16?4:23;Harness.Output(Harness.Frame(init,'E',code));Finish();}
  void Finish(){if(finished)return;finished=true;timer.Stop();pipe.Dispose();choice.TrySetCanceled();Close();}
  protected override void Dispose(bool disposing){if(disposing){timer.Dispose();}base.Dispose(disposing);}
 }
}
