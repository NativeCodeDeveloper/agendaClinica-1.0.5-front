'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, CalendarCheck, CalendarX, Clock, Activity, X, CheckCheck } from 'lucide-react';
import { useNotificaciones } from '@/hooks/useNotificaciones';

function getNotifStyle(tipo) {
    if (tipo === 'cita_nueva')     return { Icon: CalendarCheck, bg: 'bg-emerald-50',  color: 'text-emerald-600' };
    if (tipo === 'cita_estado')    return { Icon: Activity,       bg: 'bg-sky-50',      color: 'text-sky-600'     };
    if (tipo === 'cita_cancelada') return { Icon: CalendarX,      bg: 'bg-red-50',      color: 'text-red-500'     };
    if (tipo === 'recordatorio')   return { Icon: Clock,          bg: 'bg-amber-50',    color: 'text-amber-600'   };
    return { Icon: Bell, bg: 'bg-violet-50', color: 'text-[#6E56CF]' };
}

function formatRelativo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime();
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)} días`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, maxH: 400 });
    const btnRef = useRef(null);
    const { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas } = useNotificaciones();

    const calcPos = useCallback(() => {
        if (!btnRef.current) return;
        const r   = btnRef.current.getBoundingClientRect();
        const gap = 8;
        const w   = 320;
        const left = r.right + gap;
        const safeLeft = Math.min(left, window.innerWidth - w - 8);
        const maxH = Math.max(200, window.innerHeight - r.top - 24);
        setPos({ top: r.top, left: safeLeft, maxH });
    }, []);

    function toggle() { calcPos(); setOpen(o => !o); }

    // Auto-marcar leídas 4s después de abrir
    useEffect(() => {
        if (!open || notifs.length === 0) return;
        const t = setTimeout(() => marcarTodasLeidas(), 4000);
        return () => clearTimeout(t);
    }, [open, notifs.length, marcarTodasLeidas]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        if (!open) return;
        function onDown(e) {
            const panel = document.getElementById('ac-notif-panel');
            if (btnRef.current?.contains(e.target)) return;
            if (panel?.contains(e.target)) return;
            setOpen(false);
        }
        document.addEventListener('mousedown', onDown);
        window.addEventListener('resize', calcPos);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('resize', calcPos);
        };
    }, [open, calcPos]);

    const panel = open && typeof document !== 'undefined' && createPortal(
        <div
            id="ac-notif-panel"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 320, zIndex: 9999 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <Bell size={13} className="text-[#6E56CF]" />
                    <span className="text-sm font-semibold text-slate-800">Notificaciones</span>
                    {notifs.length > 0 && (
                        <span className="text-[10px] bg-violet-100 text-[#6E56CF] px-1.5 py-0.5 rounded-full font-semibold">
                            {notifs.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {notifs.length > 0 && (
                        <button onClick={marcarTodasLeidas} title="Marcar todas como leídas"
                            className="p-1.5 text-slate-400 hover:text-[#6E56CF] transition-colors rounded-lg hover:bg-violet-50">
                            <CheckCheck size={13} />
                        </button>
                    )}
                    <button onClick={() => setOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50">
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Banner push si no tiene permiso */}
            {permiso === 'default' && (
                <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 shrink-0">
                    <p className="text-xs text-slate-600 mb-2">
                        Activa las notificaciones para recibir avisos aunque no estés en la plataforma.
                    </p>
                    <button onClick={pedirPermiso}
                        className="text-xs bg-[#6E56CF] hover:bg-[#5b45bc] text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">
                        Activar notificaciones
                    </button>
                </div>
            )}
            {permiso === 'denied' && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 shrink-0">
                    <BellOff size={12} className="text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-500">Notificaciones bloqueadas en el navegador.</p>
                </div>
            )}

            {/* Lista */}
            <div className="overflow-y-auto" style={{ maxHeight: pos.maxH - 80 }}>
                {notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Bell size={22} className="text-slate-200" />
                        <p className="text-xs text-slate-400">Sin notificaciones pendientes</p>
                    </div>
                ) : (
                    notifs.map(n => {
                        const { Icon, bg, color } = getNotifStyle(n.tipo);
                        return (
                            <div key={n.id}
                                className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                    <Icon size={14} className={color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{n.titulo}</p>
                                    {n.descripcion && (
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.descripcion}</p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {formatRelativo(n.creado_en)}
                                    </p>
                                </div>
                                <button onClick={() => marcarLeida(n.id)} title="Marcar como leída"
                                    className="p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <X size={11} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <button ref={btnRef} onClick={toggle} title="Notificaciones"
                className={`group w-full flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all duration-150 relative ${
                    open
                        ? 'bg-[#F3F0FF] text-[#6E56CF]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <span className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                    open
                        ? 'bg-[#EDE9FE] text-[#6E56CF]'
                        : 'bg-slate-100/80 text-slate-400 group-hover:bg-slate-200/60 group-hover:text-slate-600'
                }`}>
                    <Bell size={13} strokeWidth={1.8} />
                    {notifs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#6E56CF] rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none">
                            {notifs.length > 9 ? '9+' : notifs.length}
                        </span>
                    )}
                </span>
                <span className="leading-none">Notificaciones</span>
            </button>
            {panel}
        </>
    );
}
