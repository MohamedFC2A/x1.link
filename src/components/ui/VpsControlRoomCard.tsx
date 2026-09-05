import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  ShieldCheck,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  Pause,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Server,
  Play
} from 'lucide-react';
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
  const [showSpecsDrawer, setShowSpecsDrawer] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    setIsLoadingTelemetry(true);
    try {
      const resp = await fetch('/api/vps?action=telemetry');
      if (resp.ok) {
        const data = await resp.json();
        setTelemetry(data);
        setFeedbackNotice('تم تحديث بيانات الخادم بنجاح');
        setTimeout(() => setFeedbackNotice(null), 3000);
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
        const display = res.stdout ? res.stdout : (res.stderr || '(لا توجد مخرجات نصية)');
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
        setTimeout(() => setFeedbackNotice(null), 3500);
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
    <div className={`my-3 rounded-xl border border-white/[0.09] bg-[#0a0b0e] p-4 sm:p-5 text-zinc-200 font-sans ${className}`} dir="rtl">
      {/* Header: Cyber Sandbox Identity */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                طرفية العمليات والأمن السيبراني السحابية (VPS Sandbox)
              </span>
              <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                ROOT
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono dir-ltr text-right">
              {telemetry.host}:{telemetry.sshPort} • Singapore SGP-1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>متصل</span>
          </span>
          <button
            type="button"
            onClick={fetchTelemetry}
            disabled={isLoadingTelemetry}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingTelemetry ? 'animate-spin text-zinc-200' : 'text-zinc-400'}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Cyber Operations & Testing Presets */}
      <div className="mb-3">
        <div className="text-[11px] text-zinc-400 font-medium mb-1.5">
          فحوصات أمنية وتجارب سريعة على السيرفر:
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleRunCommand('ss -tulpn | grep LISTEN')}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/[0.07]"
          >
            فحص المنافذ والشبكة (Ports)
          </button>
          <button
            type="button"
            onClick={() => handleRunCommand('ps aux --sort=-%cpu | head -n 8')}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/[0.07]"
          >
            فحص العمليات المشبوهة
          </button>
          <button
            type="button"
            onClick={() => handleRunCommand('uname -a && id && umask')}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/[0.07]"
          >
            بيئة النظام والصلاحيات
          </button>
          <button
            type="button"
            onClick={() => handleRunCommand('node -v && python3 --version && git --version')}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/[0.07]"
          >
            بيئة الأدوات والتنفيذ
          </button>
          <button
            type="button"
            onClick={() => handleRunCommand('pm2 status')}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer border border-white/[0.07]"
          >
            حالة PM2
          </button>
        </div>
      </div>

      {/* Primary Terminal Command Input */}
      <div className="flex items-center gap-2 rounded-lg bg-black/60 border border-white/[0.1] p-1.5 focus-within:border-white/30 transition-colors mb-3">
        <span className="text-zinc-400 font-mono text-xs px-2 select-none">$</span>
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
          placeholder="اكتب أمراً أو سكريبت لتنفيذه في بيئة السيرفر المعزولة (مثال: ss -tulpn أو curl أو nmap)..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono dir-ltr text-left"
          disabled={isExecuting}
        />
        <button
          type="button"
          onClick={() => handleRunCommand()}
          disabled={isExecuting || !customCommand.trim()}
          className="px-3 py-1.5 rounded-md bg-white/[0.12] hover:bg-white/[0.2] text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-40 active:scale-95 shrink-0 border border-white/10"
        >
          {isExecuting ? 'جاري التنفيذ...' : 'تنفيذ في السيرفر'}
        </button>
      </div>

      {/* Terminal Output Display */}
      {terminalOutput && (
        <div className="mb-3 rounded-lg bg-black/80 border border-white/[0.1] p-3 text-xs font-mono relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <span className={`size-1.5 rounded-full ${terminalExitCode === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>مخرجات التنفيذ (Exit Code: {terminalExitCode ?? 0})</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedOutput ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
          <pre className="text-zinc-200 overflow-x-auto max-h-56 dir-ltr text-left whitespace-pre-wrap leading-relaxed">
            {terminalOutput}
          </pre>
        </div>
      )}

      {/* Automation State Indicator (Clean & Muted) */}
      <div className="mb-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Pause className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            الأتمتة السحابية: {telemetry.automationStatus === 'paused' ? 'متوقفة مؤقتاً بناءً على توجيهاتك' : 'تعمل'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {telemetry.automationStatus !== 'paused' ? (
            <button
              type="button"
              onClick={() => handleAutomationAction('stop')}
              disabled={isExecuting}
              className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-[11px] transition-colors cursor-pointer border border-white/[0.08]"
            >
              إيقاف الأتمتة مؤقتاً
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAutomationAction('start')}
              disabled={isExecuting}
              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] transition-colors cursor-pointer border border-emerald-500/20"
            >
              استئناف الأتمتة
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Secondary Section: Hardware & Environment Details */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSpecsDrawer(!showSpecsDrawer)}
          className="w-full px-3 py-2 flex items-center justify-between text-[11.5px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <span>تفاصيل عتاد وموارد السيرفر (Hardware Specs & Metrics)</span>
          </div>
          {showSpecsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showSpecsDrawer && (
          <div className="p-3 border-t border-white/[0.06] space-y-3">
            {/* Subtle Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">المعالج CPU</div>
                <div className="font-mono text-sm font-bold text-zinc-200 mt-0.5">{telemetry.cpuUsagePercent}%</div>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">الذاكرة RAM</div>
                <div className="font-mono text-sm font-bold text-zinc-200 mt-0.5">{telemetry.ramUsedMb}MB / {telemetry.ramTotalMb}MB</div>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">التخزين NVMe</div>
                <div className="font-mono text-sm font-bold text-zinc-200 mt-0.5">{telemetry.diskUsedGb}GB / {telemetry.diskTotalGb}GB</div>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">مدة التشغيل</div>
                <div className="font-mono text-xs font-medium text-zinc-300 mt-1 truncate" title={telemetry.uptimeFormatted}>
                  {telemetry.uptimeFormatted}
                </div>
              </div>
            </div>

            {/* PM2 Processes List */}
            {telemetry.processes && telemetry.processes.length > 0 && (
              <div className="divide-y divide-white/[0.04] pt-1">
                <div className="text-[10px] text-zinc-500 pb-1 font-mono">عمليات PM2:</div>
                {telemetry.processes.map((proc) => (
                  <div key={proc.id} className="py-1.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${proc.status === 'online' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <span className="text-zinc-200">{proc.name}</span>
                    </div>
                    <div className="text-[10.5px] text-zinc-400 flex items-center gap-2">
                      <span>{proc.status}</span>
                      <span>MEM: {proc.memory}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
