'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Search, Stethoscope, UserRound, X } from 'lucide-react';
import ToasterClient from "@/Componentes/ToasterClient";
import { formatRut } from "@/lib/designTokens";
import toast from 'react-hot-toast';

export default function Profesionales() {
    // ════════════════════════════════════════════════════════════════════════
    // ESTADO Y LÓGICA REAL — YA CONECTADA AL BACKEND. NO MODIFICAR EL CONTRATO
    // DE ESTAS FUNCIONES (payloads / endpoints) sin coordinar con backend.
    // ════════════════════════════════════════════════════════════════════════
    const [listaProfesionales, setListaProfesionales] = useState([]);
    const [nombreProfesional, setNombreProfesional] = useState('');
    const [descripcionProfesional, setDescripcionProfesional] = useState('');
    const [id_profesional, setIdProfesional] = useState("");

    // ══════════════════════════════════════════════════════════════════════════
    // MODALIDAD DE ATENCIÓN — requiere migración de BD:
    //   ALTER TABLE profesionales
    //     ADD COLUMN modalidad_atencion VARCHAR(20) NOT NULL DEFAULT 'ambas'
    //     COMMENT 'presencial | online | ambas';
    //
    // Actualizar endpoint POST /profesionales/insertarProfesional:
    //   Aceptar { nombreProfesional, descripcionProfesional, modalidad_atencion }
    //
    // Actualizar endpoint POST /profesionales/actualizarProfesional:
    //   Aceptar { nombreProfesional, descripcionProfesional, modalidad_atencion, id_profesional }
    //
    // Retornar modalidad_atencion en GET seleccionarTodosProfesionales y POST seleccionarProfesional
    // ══════════════════════════════════════════════════════════════════════════
    const [modalidadAtencion, setModalidadAtencion] = useState('ambas'); // 'presencial' | 'online' | 'ambas'
    const API = process.env.NEXT_PUBLIC_API_URL;


    async function seleccionarTodosProfesionales() {
        try {
            const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`, {
                method: 'GET',
                headers: {Accept: 'application/json'},
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend){
                    setListaProfesionales(respustaBackend);

                }else{
                    return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al cargar los profesionales, por favor intente nuevamente.');
        }
    }

    useEffect(() => {
        seleccionarTodosProfesionales();
    }, []);


    async function seleccionarProfesional(id_profesional) {
        try {

            if(!id_profesional){
                return toast.error('Por favor seleccione un profesional para continuar con la edición.');
            }

            const res = await fetch(`${API}/profesionales/seleccionarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_profesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(Array.isArray(respustaBackend) && respustaBackend.length > 0){
                    setNombreProfesional(respustaBackend[0].nombreProfesional);
                    setDescripcionProfesional(respustaBackend[0].descripcionProfesional);
                    // Carga modalidad guardada (requiere migración BD)
                    setModalidadAtencion(respustaBackend[0].modalidad_atencion ?? 'ambas');
                    setIdProfesional(respustaBackend[0].id_profesional);
                    return toast.success('Profesional seleccionado correctamente.');
                }else{
                    return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al seleccionar el profesional, por favor intente nuevamente.');
        }
    }



    async function eliminarProfesional(id_profesional) {
        try {
            if(!id_profesional){
                return toast.error('Por favor seleccione un profesional para continuar con la eliminacion.');
            }
            const res = await fetch(`${API}/profesionales/eliminarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({id_profesional}),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');

            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreProfesional("");
                    setDescripcionProfesional("");
                    setIdProfesional("");
                    await seleccionarTodosProfesionales();
                    return toast.success('Profesional eliminado correctamente.');
                }else{
                    return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al eliminar el profesional, por favor intente nuevamente.');
        }
    }




    async function insertarProfesional(nombreProfesional,descripcionProfesional) {
        try {

            if(!nombreProfesional || !descripcionProfesional){
                return toast.error('Por favor complete todos los campos para insertar el profesional.');
            }

            const res = await fetch(`${API}/profesionales/insertarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({ nombreProfesional, descripcionProfesional, modalidad_atencion: modalidadAtencion }),
                mode: 'cors'
            })

                if (!res.ok) {
                    return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
                }else{
                    const respustaBackend = await res.json();

                    if(respustaBackend.message === true){
                        setNombreProfesional('');
                        setDescripcionProfesional('');
                        await seleccionarTodosProfesionales();
                        return toast.success('Profesional insertado correctamente.');
                    }else{
                        return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
                    }
                }
        }catch (error) {
            return toast.error('Error al insertar el profesional, por favor intente nuevamente.');
        }
    }



    async function actualizarProfesional(nombreProfesional,descripcionProfesional,id_profesional) {
        try {

            if(!nombreProfesional || !descripcionProfesional || !id_profesional){
                return toast.error('Por favor complete todos los campos para actualizar el profesional.');
            }

            const res = await fetch(`${API}/profesionales/actualizarProfesional`, {
                method: 'POST',
                headers: {Accept: 'application/json',
                    'Content-Type': 'application/json'},
                body: JSON.stringify({ nombreProfesional, descripcionProfesional, id_profesional, modalidad_atencion: modalidadAtencion }),
                mode: 'cors'
            })

            if (!res.ok) {
                return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
            }else{
                const respustaBackend = await res.json();

                if(respustaBackend.message === true){
                    setNombreProfesional('');
                    setDescripcionProfesional('');
                    setIdProfesional("");
                    await seleccionarTodosProfesionales();
                    return toast.success('Profesional actualizado correctamente.');

                }else{
                    return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
                }
            }
        }catch (error) {
            return toast.error('Error al actualizar el profesional, por favor intente nuevamente.');
        }
    }


    // ════════════════════════════════════════════════════════════════════════
    // CAMPOS NUEVOS (RUT, EMAIL, TELÉFONO, ESTADO ACTIVO) — MAQUETADO, PENDIENTE
    // DE BACKEND. Estos datos hoy se guardan solo en localStorage (mock) para
    // que la vista quede completamente funcional en pantalla mientras se
    // implementa la persistencia real. Cuando el backend esté listo:
    //
    //   1) Migración sugerida:
    //        ALTER TABLE profesionales
    //          ADD COLUMN rut_profesional VARCHAR(12) NULL,
    //          ADD COLUMN email_profesional VARCHAR(120) NULL,
    //          ADD COLUMN telefono_profesional VARCHAR(30) NULL,
    //          ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
    //
    //   2) Endpoints a actualizar:
    //        POST /profesionales/insertarProfesional
    //          -> aceptar { ...payload actual, rut_profesional, email_profesional, telefono_profesional }
    //          -> RECOMENDADO: retornar el id_profesional recién creado en la respuesta
    //             (hoy solo retorna { message: true }, lo que obliga a este mock a
    //             emparejar por nombre — ver `claveExtraProfesional` más abajo).
    //        POST /profesionales/actualizarProfesional
    //          -> aceptar { ...payload actual, rut_profesional, email_profesional, telefono_profesional }
    //        POST /profesionales/actualizarEstadoProfesional  (nuevo, para Activar/Desactivar)
    //          -> body { id_profesional, activo } -> UPDATE profesionales SET activo = :activo WHERE id_profesional = :id
    //        GET  /profesionales/seleccionarTodosProfesionales y POST seleccionarProfesional
    //          -> retornar rut_profesional, email_profesional, telefono_profesional, activo
    //
    //   3) Una vez el backend retorne estos campos directo en `listaProfesionales`,
    //      eliminar todo este bloque de mock (estado `extrasProfesionales`,
    //      `claveExtraProfesional`, `obtenerExtraProfesional`, `guardarExtraProfesional`,
    //      `alternarActivoProfesional` y la carga/escritura de localStorage) y leer
    //      los campos directo desde cada `profesional` de la lista real.
    // ════════════════════════════════════════════════════════════════════════
    const CLAVE_MOCK_EXTRAS_PROFESIONALES = "profesionales_datos_extendidos_mock";
    const [extrasProfesionales, setExtrasProfesionales] = useState({});

    useEffect(() => {
        try {
            const guardado = window.localStorage.getItem(CLAVE_MOCK_EXTRAS_PROFESIONALES);
            if (guardado) setExtrasProfesionales(JSON.parse(guardado));
        } catch (error) {
            console.log(error);
        }
    }, []);

    function persistirExtrasProfesionales(siguientesExtras) {
        setExtrasProfesionales(siguientesExtras);
        try {
            window.localStorage.setItem(CLAVE_MOCK_EXTRAS_PROFESIONALES, JSON.stringify(siguientesExtras));
        } catch (error) {
            console.log(error);
        }
    }

    // MOCK: se indexa por nombre (no por id_profesional) porque insertarProfesional
    // no retorna el id del registro recién creado — ver punto 2 del comentario superior.
    function claveExtraProfesional(nombre) {
        return String(nombre || "").trim().toLowerCase();
    }

    function obtenerExtraProfesional(nombre) {
        return extrasProfesionales[claveExtraProfesional(nombre)] || { rut: "", email: "", telefono: "", activo: true };
    }

    function guardarExtraProfesional(nombre, datosExtra) {
        const clave = claveExtraProfesional(nombre);
        if (!clave) return;
        persistirExtrasProfesionales({
            ...extrasProfesionales,
            [clave]: { ...obtenerExtraProfesional(nombre), ...datosExtra }
        });
    }

    function alternarActivoProfesional(nombre) {
        const actual = obtenerExtraProfesional(nombre);
        guardarExtraProfesional(nombre, { activo: !(actual.activo !== false) });
    }


    // ── UI: buscador, grilla de tarjetas y modal de nuevo/editar ──
    const [busquedaProfesionales, setBusquedaProfesionales] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [rutProfesionalForm, setRutProfesionalForm] = useState("");
    const [emailProfesionalForm, setEmailProfesionalForm] = useState("");
    const [telefonoProfesionalForm, setTelefonoProfesionalForm] = useState("");

    function abrirModalNuevoProfesional() {
        setModoEdicion(false);
        setNombreProfesional("");
        setDescripcionProfesional("");
        setIdProfesional("");
        setRutProfesionalForm("");
        setEmailProfesionalForm("");
        setTelefonoProfesionalForm("");
        setModalAbierto(true);
    }

    async function abrirModalEditarProfesional(profesional) {
        setModoEdicion(true);
        await seleccionarProfesional(profesional.id_profesional); // real: carga nombre/descripción/id
        const extra = obtenerExtraProfesional(profesional.nombreProfesional);
        setRutProfesionalForm(extra.rut || "");
        setEmailProfesionalForm(extra.email || "");
        setTelefonoProfesionalForm(extra.telefono || "");
        setModalAbierto(true);
    }

    function cerrarModalProfesional() {
        setModalAbierto(false);
    }

    async function guardarProfesionalDesdeModal(evento) {
        evento.preventDefault();
        const nombreGuardado = nombreProfesional;

        if (modoEdicion) {
            await actualizarProfesional(nombreProfesional, descripcionProfesional, id_profesional); // real
        } else {
            await insertarProfesional(nombreProfesional, descripcionProfesional); // real
        }

        // MOCK: guarda RUT/email/teléfono localmente — ver bloque de comentarios arriba
        guardarExtraProfesional(nombreGuardado, {
            rut: rutProfesionalForm,
            email: emailProfesionalForm,
            telefono: telefonoProfesionalForm,
        });

        setModalAbierto(false);
    }

    const profesionalesFiltrados = useMemo(() => {
        const termino = busquedaProfesionales.trim().toLowerCase();
        return listaProfesionales
            .map((profesional) => ({ ...profesional, _extra: obtenerExtraProfesional(profesional.nombreProfesional) }))
            .filter((profesional) => {
                if (!termino) return true;
                return (
                    String(profesional.nombreProfesional || "").toLowerCase().includes(termino) ||
                    String(profesional.descripcionProfesional || "").toLowerCase().includes(termino) ||
                    String(profesional._extra.email || "").toLowerCase().includes(termino)
                );
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listaProfesionales, busquedaProfesionales, extrasProfesionales]);

    const totalActivos = profesionalesFiltrados.filter((profesional) => profesional._extra.activo !== false).length;

    function inicialesProfesional(nombre) {
        const palabras = String(nombre || "").trim().split(/\s+/).filter(Boolean);
        const relevantes = palabras.filter((palabra) => !["dr", "dr.", "dra", "dra."].includes(palabra.toLowerCase()));
        const base = relevantes.length ? relevantes : palabras;
        return base.slice(0, 2).map((palabra) => palabra.charAt(0).toUpperCase()).join("") || "PR";
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient />

            <div className="mx-auto w-full max-w-6xl px-6 py-10">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Configuración clínica</p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">Profesionales</h1>
                        <p className="mt-1 text-sm text-slate-500">{totalActivos} profesionales activos</p>
                    </div>
                    <button
                        type="button"
                        onClick={abrirModalNuevoProfesional}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[13px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Profesional
                    </button>
                </div>

                {/* Buscador */}
                <div className="relative mb-8">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busquedaProfesionales}
                        onChange={(evento) => setBusquedaProfesionales(evento.target.value)}
                        placeholder="Buscar por nombre, especialidad o email..."
                        aria-label="Buscar profesionales"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                    />
                </div>

                {/* Grilla de tarjetas */}
                {profesionalesFiltrados.length === 0 ? (
                    <div className="rounded-[32px] border border-dashed border-slate-200 bg-white py-24 text-center">
                        <p className="text-sm font-medium text-slate-400">
                            {listaProfesionales.length === 0 ? "No hay profesionales registrados todavía." : "No se encontraron profesionales para esa búsqueda."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {profesionalesFiltrados.map((profesional) => {
                            const extra = profesional._extra;
                            const activo = extra.activo !== false;

                            return (
                                <div
                                    key={profesional.id_profesional}
                                    className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6E56CF] text-sm font-bold text-white">
                                                {inicialesProfesional(profesional.nombreProfesional)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-[15px] font-bold text-slate-900">{profesional.nombreProfesional}</h3>
                                                <p className="truncate text-[12px] text-slate-400">{profesional.descripcionProfesional || "Sin especialidad registrada"}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${activo ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                                            {activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>

                                    <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                                        <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                            <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate font-mono">{extra.rut ? (formatRut(extra.rut) || extra.rut) : "RUT no registrado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate">{extra.email || "Sin correo registrado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate">{extra.telefono || "Sin teléfono registrado"}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                                        <button
                                            type="button"
                                            onClick={() => abrirModalEditarProfesional(profesional)}
                                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => alternarActivoProfesional(profesional.nombreProfesional)}
                                            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            {activo ? "Desactivar" : "Activar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => eliminarProfesional(profesional.id_profesional)}
                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-[12px] font-bold text-rose-600 transition hover:bg-rose-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Nuevo / Editar Profesional */}
            {modalAbierto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 py-8"
                    onClick={cerrarModalProfesional}
                >
                    <div
                        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
                        onClick={(evento) => evento.stopPropagation()}
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-[#6E56CF]">
                                    <Stethoscope className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {modoEdicion ? "Editar Profesional" : "Nuevo Profesional"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={cerrarModalProfesional}
                                aria-label="Cerrar"
                                className="text-slate-400 transition hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={guardarProfesionalDesdeModal} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-slate-700">Nombre completo *</label>
                                <input
                                    required
                                    value={nombreProfesional}
                                    onChange={(evento) => setNombreProfesional(evento.target.value)}
                                    placeholder="Dr. Juan Pérez"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-slate-700">RUT *</label>
                                <input
                                    required
                                    value={rutProfesionalForm}
                                    onChange={(evento) => setRutProfesionalForm(evento.target.value)}
                                    placeholder="12.345.678-9"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                                />
                                {/* MOCK: rut_profesional aún no existe en backend — ver comentario "CAMPOS NUEVOS" arriba */}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-slate-700">Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={emailProfesionalForm}
                                    onChange={(evento) => setEmailProfesionalForm(evento.target.value)}
                                    placeholder="dra.gonzalez@clinica.cl"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-slate-700">Teléfono</label>
                                <input
                                    value={telefonoProfesionalForm}
                                    onChange={(evento) => setTelefonoProfesionalForm(evento.target.value)}
                                    placeholder="+56 9 8765 4321"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-slate-700">Especialidad *</label>
                                <input
                                    required
                                    value={descripcionProfesional}
                                    onChange={(evento) => setDescripcionProfesional(evento.target.value)}
                                    placeholder="Ej: Especialista en Ortodoncia"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-700 outline-none transition focus:border-[#6E56CF] focus:ring-4 focus:ring-violet-100"
                                />
                                {/* Campo real: se guarda en descripcionProfesional (ya conectado al backend) */}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={cerrarModalProfesional}
                                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="h-11 flex-1 rounded-xl bg-slate-900 text-[13px] font-bold text-white transition hover:bg-slate-800"
                                >
                                    {modoEdicion ? "Guardar Cambios" : "Registrar Profesional"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
