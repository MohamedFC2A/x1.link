import React, { useState, useEffect, useCallback } from 'react';
import { Server, Terminal, Cpu, HardDrive, Activity, Clock, Play, Pause, RotateCw, RefreshCw, Copy, Check, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VpsTelemetryData, VpsExecutionResult } from '../../types';

export interface VpsControlRoomCardProps {
  initialTelemetry?: VpsTelemetryData | null;
  onExecuteCommand?: (cmd: string) => Promise<VpsExecutionResult>;
  className?: string;
}

export const VpsControlRoomCard: React.FC<VpsControlRoomCardProps> = ({
  initialTelemetry,
  className = '',
}) => {
  const [telemetry, setTelemetry] = useState<VpsTelemetryData>(initialTelemetry || {
    host: '104.207.77.162',
    sshPort: 22022,
    connected: true,
    timestamp: new Date().toISOString(),
    osInfo: 'Ubuntu 24.04.4 LTS (Linux 6.8.0-90-generic)',
    uptimeFormatted: '24 days, 15:30',
    cpuUsagePercent: 0.9,
    ramTotalMb: 1968,
    ramUsedMb: 441,
    ramFreeMb: 1527,
    ramUsagePercent: 22.4,
    diskTotalGb: 24.0,
    diskUsedGb: 7.3,
    diskFreeGb: 16.7,
    diskUsagePercent: 30.4,
    automationStatus: 'paused',
    processes: [
      { id: 0, name: 'upstore-bot', status: 'stopped', cpu: '0%', memory: '0MB', uptime: '0m', restarts: 48, pid: 0, user: 'root' },
      { id: 14, name: 'upstore-promoter', status: 'stopped', cpu: '0%', memory: '0MB', uptime: '0m', restarts: 19, pid: 0, user: 'root' },
      { id: 12, name: 'promoter-test-30m', status: 'stopped', cpu: '0%', memory: '0MB', uptime: '0m', restarts: 0, pid: 0, user: 'root' },
      { id: 13, name: 'pm2-logrotate', status: 'online', cpu: '0%', memory: '82.0MB', uptime: '24h', restarts: 3, pid: 196852, user: 'root' },
    ],
    listeningPorts: ['0.0.0.0:22022', '127.0.0.1:3000'],
    statusNotice: 'يتم الان الوصول للكمبيوتر والاوامر السحابية',
  });

  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [terminalExitCode, setTerminalExitCode] = useState<number | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [showProcesses, setShowProcesses] = useState(true);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    setIsLoadingTelemetry(true);
    try {
      const resp = await fetch('/api/vps?action=telemetry');
      if (resp.ok) {
        const data = await resp.json();
        setTelemetry(data);
        setFeedbackNotice('تم تحديث مقاييس الخادم بنجاح');
        setTimeout(() => setFeedbackNotice(null), 3500);
      }
    } catch (e) {
      console.warn('Failed to fetch live VPS telemetry:', e);
    } finally {
      setIsLoadingTelemetry(false);
    }
  }, []);

  const handleRunCommand = async (cmdToRun?: string) => {
    const target = (cmdToRun || customCommand).trim();
    if (!target) return;
    setIsExecuting(true);
    try {
      const resp = await fetch('/api/vps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: target }),
      });
      if (resp.ok) {
        const res: VpsExecutionResult = await resp.json();
        const display = res.stdout ? res.stdout : (res.stderr || '(لا يوجد مخرجات نصية)');
        setTerminalOutput(`$ ${res.command}\n\n${display}`);
        setTerminalExitCode(res.exitCode);
      } else {
        const errJson = await resp.json().catch(() => ({}));
        setTerminalOutput(`خطأ في التنفيذ: ${errJson.error || resp.statusText}`);
        setTerminalExitCode(1);
      }
    } catch (e: any) {
      setTerminalOutput(`فشل الاتصال بالخادم: ${e.message || 'خطأ في الشبكة'}`);
      setTerminalExitCode(1);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAutomationAction = async (action: 'stop' | 'start' | 'restart') => {
    setIsExecuting(true);
    try {
      const resp = await fetch('/api/vps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationAction: action }),
      });
      if (resp.ok) {
        const res = await resp.json();
        setTerminalOutput(res.output || res.message);
        setFeedbackNotice(res.message);
        setTimeout(() => setFeedbackNotice(null), 4000);
        await fetchTelemetry();
      }
    } catch (e: any) {
      setFeedbackNotice(`فشل تنفيذ الإجراء: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    if (!terminalOutput) return;
    navigator.clipboard.writeText(terminalOutput);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className={`my-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-zinc-100 font-sans ${className}`} dir="rtl">
      {/* Top Banner: Status Notice */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3.5 py-2.5 shadow-inner">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-cyan-300">
            ⚡ {telemetry.statusNotice || 'يتم الان الوصول للكمبيوتر والاوامر السحابية'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-black/50 px-2 py-1 rounded-md border border-white/5">
          <span>{telemetry.host}:{telemetry.sshPort}</span>
          <span className="text-emerald-400 font-semibold">• متصل</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-600/30 via-indigo-600/20 to-purple-600/30 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Server className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              غرفة التحكم بالكمبيوتر السحابي (VPS)
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                ROOT ACCESS
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              {telemetry.osInfo} • سنغافورة (SGP-1)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTelemetry}
            disabled={isLoadingTelemetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs text-zinc-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="تحديث البيانات اللحظية"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTelemetry ? 'animate-spin text-cyan-400' : 'text-zinc-400'}`} />
            <span>تحديث المقاييس</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="mb-3.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Metrics Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {/* CPU */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>المعالج (CPU)</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              {telemetry.cpuUsagePercent}%
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">1 vCPU</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, telemetry.cpuUsagePercent))}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>الذاكرة (RAM)</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              {telemetry.ramUsedMb}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">/ {telemetry.ramTotalMb}MB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, telemetry.ramUsagePercent))}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>التخزين (NVMe)</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              {telemetry.diskUsedGb}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">/ {telemetry.diskTotalGb}GB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, telemetry.diskUsagePercent))}%` }}
            />
          </div>
        </div>

        {/* Uptime */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>مدة التشغيل</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold font-mono text-white truncate" title={telemetry.uptimeFormatted}>
              {telemetry.uptimeFormatted}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-emerald-400"></span>
              مستقر وبحالة ممتازة
            </div>
          </div>
        </div>
      </div>

      {/* Automation Pause Status Banner */}
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-amber-200">
          <Pause className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">حالة الأتمتة السحابية: </span>
            <span>
              {telemetry.automationStatus === 'paused'
                ? 'متوقفة مؤقتاً (جميع العمليات متوقفة بناءً على توجيهاتك)'
                : telemetry.automationStatus === 'running'
                ? 'تعمل بالكامل في الخلفية'
                : 'متوقفة جزئياً'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {telemetry.automationStatus !== 'paused' ? (
            <button
              type="button"
              onClick={() => handleAutomationAction('stop')}
              disabled={isExecuting}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium transition-colors cursor-pointer border border-amber-500/30 disabled:opacity-50"
            >
              إيقاف الأتمتة مؤقتاً
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAutomationAction('start')}
              disabled={isExecuting}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-medium transition-colors cursor-pointer border border-emerald-500/30 disabled:opacity-50"
            >
              استئناف الأتمتة
            </button>
          )}
        </div>
      </div>

      {/* PM2 Processes Collapsible Section */}
      <div className="mb-4 rounded-xl border border-white/[0.08] bg-black/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProcesses(!showProcesses)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-zinc-300 font-semibold bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>عمليات PM2 المحملة على الخادم ({telemetry.processes.length})</span>
          </div>
          {showProcesses ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {showProcesses && (
          <div className="p-3 divide-y divide-white/[0.05]">
            {telemetry.processes.map((proc) => (
              <div key={proc.id} className="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-2 rounded-full shrink-0 ${proc.status === 'online' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  <span className="font-bold text-white truncate">{proc.name}</span>
                  <span className="text-[10px] text-zinc-500">#{proc.id}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${proc.status === 'online' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                    {proc.status}
                  </span>
                  <span>CPU: {proc.cpu}</span>
                  <span>MEM: {proc.memory}</span>
                  <span>إعادة تشغيل: {proc.restarts}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Commands */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400 ml-1">أوامر سريعة:</span>
        <button
          type="button"
          onClick={() => handleRunCommand('uname -a && uptime && free -h')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/5"
        >
          فحص الموارد
        </button>
        <button
          type="button"
          onClick={() => handleRunCommand('pm2 list')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/5"
        >
          قائمة PM2
        </button>
        <button
          type="button"
          onClick={() => handleRunCommand('ss -tulpn | grep LISTEN')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/5"
        >
          المنافذ المفتوحة
        </button>
        <button
          type="button"
          onClick={() => handleRunCommand('pm2 stop all')}
          disabled={isExecuting}
          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[11px] font-mono text-amber-300 transition-colors cursor-pointer border border-amber-500/25"
        >
          إيقاف الأتمتة (stop all)
        </button>
      </div>

      {/* Terminal Command Input */}
      <div className="flex items-center gap-2 rounded-xl bg-black/60 border border-white/[0.08] p-1.5 focus-within:border-cyan-500/50 transition-colors">
        <span className="text-cyan-400 font-mono text-xs px-2 select-none">$</span>
        <input
          type="text"
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleRunCommand();
            }
          }}
          placeholder="اكتب أمر bash لتنفيذه مباشرة على السيرفر (مثال: df -h أو uptime أو node -v)..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono dir-ltr text-left"
          disabled={isExecuting}
        />
        <button
          type="button"
          onClick={() => handleRunCommand()}
          disabled={isExecuting || !customCommand.trim()}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all cursor-pointer disabled:opacity-40 active:scale-95 shrink-0"
        >
          {isExecuting ? 'جاري التنفيذ...' : 'تنفيذ'}
        </button>
      </div>

      {/* Terminal Output Display */}
      {terminalOutput && (
        <div className="mt-3 rounded-xl bg-black/90 border border-white/[0.12] p-3 text-xs font-mono relative overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className={`size-2 rounded-full ${terminalExitCode === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>مخرجات الطرفية السحابية (Exit: {terminalExitCode ?? 0})</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOutput ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
          <pre className="text-zinc-200 overflow-x-auto max-h-56 dir-ltr text-left whitespace-pre-wrap leading-relaxed selection:bg-cyan-500/30">
            {terminalOutput}
          </pre>
        </div>
      )}
    </div>
  );
};
