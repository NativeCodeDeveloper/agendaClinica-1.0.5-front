"use client"

import {useParams} from "next/navigation";
import {useState, useEffect} from "react";
import {toast} from "react-hot-toast";
import {Textarea} from "@/components/ui/textarea";
import ShadcnDatePicker from "@/Componentes/shadcnDatePicker";
import ToasterClient from "@/Componentes/ToasterClient";
import Link from "next/link";
import {ShadcnInput} from "@/Componentes/shadcnInput";
import {ShadcnButton} from "@/Componentes/shadcnButton";
import {useRouter} from "next/navigation";
import { formatRut } from "@/lib/designTokens";

function transformarPlantilla(filas) {
    if (!filas || filas.length === 0) return null
    const primera = filas[0]
    const categoriasMap = {}

    filas.forEach(fila => {
        if (!fila.id_categoria) return
        if (!categoriasMap[fila.id_categoria]) {
            categoriasMap[fila.id_categoria] = {
                id_categoria: fila.id_categoria,
                nombre: fila.categoria_nombre,
                orden: fila.categoria_orden,
                campos: []
            }
        }
        if (fila.id_campo) {
            categoriasMap[fila.id_categoria].campos.push({
                id_campo: fila.id_campo,
                nombre: fila.campo_nombre,
                requerido: fila.requerido,
                orden: fila.campo_orden
            })
        }
    })

    return {
        id_plantilla: primera.id_plantilla,
        nombre: primera.plantilla_nombre,
        categorias: Object.values(categoriasMap).sort((a, b) => a.orden - b.orden)
    }
}

export default function NuevaFicha() {

    const {id_paciente} = useParams();
    const [dataPaciente, setDataPaciente] = useState([]);
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();

    function retroceder(id_paciente) {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    // Campos base
    const [fechaConsulta, setFechaConsulta] = useState("");
    const [observacionesPrecio, setObservacionesPrecio] = useState("");

    // Plantilla dinámica
    const [plantillas, setPlantillas] = useState([])
    const [idPlantilla, setIdPlantilla] = useState("")
    const [plantillaCompleta, setPlantillaCompleta] = useState(null)
    const [datosDinamicos, setDatosDinamicos] = useState({})
    const [mejorandoRedaccion, setMejorandoRedaccion] = useState(false)

    // Cargar lista de plantillas al montar
    async function listarPlantillas() {
        try {
            const res = await fetch(`${API}/fichaPlantilla/listarPlantillas`)
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) {
                setPlantillas(data)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Cargar plantilla completa cuando se selecciona
    async function seleccionarPlantilla(id_plantilla) {
        setIdPlantilla(id_plantilla)
        setDatosDinamicos({})
        setPlantillaCompleta(null)

        if (!id_plantilla) return

        try {
            const res = await fetch(`${API}/fichaPlantilla/obtenerPlantillaCompleta`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id_plantilla})
            })

            if (!res.ok) {
                return toast.error("No se pudo cargar la plantilla seleccionada.")
            }

            const filas = await res.json()
            const estructura = transformarPlantilla(filas)
            setPlantillaCompleta(estructura)
        } catch (error) {
            console.log(error)
            return toast.error("Error al cargar la plantilla.")
        }
    }

    async function mejorarRedaccionConCortex() {
        const camposConTexto = plantillaCompleta?.categorias.flatMap((categoria) =>
            categoria.campos
                .map((campo) => ({
                    id: String(campo.id_campo),
                    nombre: campo.nombre,
                    texto: datosDinamicos[campo.id_campo] || ""
                }))
                .filter((campo) => campo.texto.trim())
        ) || [];

        if (camposConTexto.length === 0) {
            return toast.error("Complete al menos un campo antes de mejorar la redacción.");
        }

        setMejorandoRedaccion(true);

        try {
            const res = await fetch(`${API}/cortex/mejorar-redaccion-ficha`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({campos: camposConTexto})
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "Cortex no pudo mejorar la redacción.");
            }

            const idsPermitidos = new Set(camposConTexto.map((campo) => campo.id));
            const camposMejorados = Array.isArray(data.campos)
                ? data.campos.filter((campo) =>
                    idsPermitidos.has(String(campo?.id)) &&
                    typeof campo?.texto === "string" &&
                    campo.texto.trim()
                )
                : [];

            if (camposMejorados.length === 0) {
                throw new Error("Cortex no devolvió campos válidos para reemplazar.");
            }

            const valoresMejorados = Object.fromEntries(
                camposMejorados.map((campo) => [String(campo.id), campo.texto.trim()])
            );

            setDatosDinamicos((prev) => ({...prev, ...valoresMejorados}));
            return toast.success(
                `Cortex mejoró la redacción de ${camposMejorados.length} ${camposMejorados.length === 1 ? "campo" : "campos"}.`
            );
        } catch (error) {
            return toast.error(error.message || "No se pudo mejorar la redacción en este momento.");
        } finally {
            setMejorandoRedaccion(false);
        }
    }

    async function insertarFicha() {
        try {
            if (!id_paciente) {
                return toast.error('Debe seleccionar un paciente para ingresar una nueva ficha.')
            }

            if (!idPlantilla || !plantillaCompleta) {
                return toast.error('Debe seleccionar una plantilla para la ficha.')
            }

            // Validar campos requeridos
            const camposFaltantes = []
            plantillaCompleta.categorias.forEach(cat => {
                cat.campos.forEach(campo => {
                    if (campo.requerido === 1 && !datosDinamicos[campo.id_campo]?.trim()) {
                        camposFaltantes.push(campo.nombre)
                    }
                })
            })

            if (camposFaltantes.length > 0) {
                return toast.error(`Debe completar los campos obligatorios: ${camposFaltantes.join(", ")}`)
            }

            // Construir datosDinamicos enriquecido con nombres de campo/categoría
            const datosEnriquecidos = {
                _plantillaNombre: plantillaCompleta.nombre
            }
            plantillaCompleta.categorias.forEach(cat => {
                cat.campos.forEach(campo => {
                    if (datosDinamicos[campo.id_campo]) {
                        datosEnriquecidos[campo.id_campo] = {
                            valor: datosDinamicos[campo.id_campo],
                            nombreCampo: campo.nombre,
                            nombreCategoria: cat.nombre,
                            categoriaOrden: cat.orden,
                            campoOrden: campo.orden
                        }
                    }
                })
            })

            const res = await fetch(`${API}/ficha/insertarFichaClinica`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_paciente,
                    tipoAtencion: "",
                    motivoConsulta: "",
                    signosVitales: "",
                    observaciones: observacionesPrecio,
                    anotacionConsulta: "",
                    anamnesis: "",
                    diagnostico: "",
                    indicaciones: "",
                    archivosAdjuntos: "",
                    fechaConsulta,
                    consentimientoFirmado: "",
                    id_plantilla: idPlantilla,
                    datosDinamicos: datosEnriquecidos
                }),
                mode: "cors"
            })

            if (!res.ok) {
                return toast.error("Faltan datos para ingresar la nueva ficha.");
            }

            const respuestaQuery = await res.json();
            if (respuestaQuery.message === true) {
                setObservacionesPrecio("");
                setFechaConsulta("");
                setDatosDinamicos({});
                setIdPlantilla("");
                setPlantillaCompleta(null);
                return toast.success("Nueva ficha ingresada con Exito!");
            } else {
                return toast.error("Faltan datos para ingresar la nueva ficha.");
            }
        } catch (error) {
            console.log(error);
            return toast.error("Ha ocurrido un error en el servidor, Contacte a soporte tecnico de Medify");
        }
    }

    async function buscarPacientePorId(id_paciente) {
        try {
            if (!id_paciente) {
                return toast.error(
                    "No se puede cargar los datos del paciente seleccionado. Debe haber seleccionado el paciente para poder ver el detalle de los datos."
                );
            }

            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({id_paciente}),
            });

            if (!res.ok) {
                return toast.error("No se puede cargar los datos del paciente seleccionado.");
            }

            const data = await res.json();
            setDataPaciente(Array.isArray(data) ? data : [data]);
        } catch (error) {
            console.log(error);
            return toast.error(
                "No se puede cargar los datos del paciente seleccionado. Por favor contacte a soporte de Medify"
            );
        }
    }

    useEffect(() => {
        if (!id_paciente) return;
        buscarPacientePorId(id_paciente);
        listarPlantillas();
    }, [id_paciente]);

    const paciente = dataPaciente[0] ?? null;
    const hayCamposParaMejorar = Object.values(datosDinamicos).some(
        (valor) => typeof valor === "string" && valor.trim()
    );

    return (
        <div className="min-h-screen bg-[#FAFAFB]">
            <ToasterClient/>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

                {/* ── Header ── */}
                <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">Fichas Clínicas</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Nueva Ficha Clínica</h1>
                    <p className="mt-1 text-[13px] text-slate-500">Complete los campos para registrar la atención del paciente</p>
                </div>

                {/* ── Acciones ── */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {paciente && (
                        <button
                            onClick={() => retroceder(paciente.id_paciente)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-[#6E56CF] hover:bg-[#5B47B0] shadow-sm transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                            </svg>
                            Carpeta del Paciente
                        </button>
                    )}
                    <Link href="/dashboard">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                            Volver
                        </button>
                    </Link>
                </div>

                {/* ── Tarjeta del paciente ── */}
                {paciente && (
                    <div className="mb-6 rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {/* Identidad */}
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-base font-bold text-[#6E56CF]">
                                {paciente.nombre?.charAt(0)}{paciente.apellido?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="text-[11px] font-semibold text-[#6E56CF] bg-[#F3F0FF] border border-[#DDD6FE] rounded-lg px-2 py-0.5 uppercase tracking-wide">
                                        ID #{paciente.id_paciente}
                                    </span>
                                </div>
                                <p className="text-base font-bold text-slate-900">{paciente.nombre} {paciente.apellido}</p>
                                <p className="text-[13px] text-slate-500 font-mono">RUT {formatRut(paciente.rut)}</p>
                            </div>
                        </div>
                        {/* Datos rápidos */}
                        <div className="grid grid-cols-2 gap-px bg-slate-100 md:grid-cols-4">
                            {[
                                { label: "Teléfono",   value: paciente.telefono },
                                { label: "Correo",     value: paciente.correo },
                                { label: "Apoderado",  value: paciente.apoderado },
                                { label: "RUT apoderado", value: paciente.apoderado_rut },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white px-5 py-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">{label}</p>
                                    <p className="text-[13px] font-medium text-slate-800 break-words">{value || "---"}</p>
                                </div>
                            ))}
                        </div>
                        {/* Antecedentes */}
                        {(paciente.medicamentosUsados || paciente.habitos || paciente.comentariosAdicionales) && (
                            <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-3 border-t border-slate-100">
                                {[
                                    { label: "Medicamentos usados",     value: paciente.medicamentosUsados },
                                    { label: "Hábitos",                 value: paciente.habitos },
                                    { label: "Comentarios adicionales", value: paciente.comentariosAdicionales },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="bg-white px-5 py-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">{label}</p>
                                        <p className="text-[13px] text-slate-700 leading-relaxed break-words whitespace-pre-wrap">{value}</p>
                                    </div>
                                ) : null)}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Formulario de ficha ── */}
                <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">

                    {/* Sección: Información de la consulta */}
                    <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                        <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h2 className="text-sm font-semibold text-slate-800">Información de la Consulta</h2>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Selector de plantilla */}
                        <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Plantilla de ficha <span className="text-red-400 normal-case">*</span>
                            </label>
                            <select
                                value={idPlantilla}
                                onChange={(e) => seleccionarPlantilla(e.target.value)}
                                disabled={mejorandoRedaccion}
                                className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-[#6E56CF] transition-all text-slate-700"
                                style={{ colorScheme: "light" }}
                            >
                                <option value="">Seleccione una plantilla...</option>
                                {plantillas.map((p) => (
                                    <option key={p.id_plantilla} value={p.id_plantilla}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha + Profesional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Fecha de consulta</label>
                                <ShadcnDatePicker label="" value={fechaConsulta} onChange={(fecha) => setFechaConsulta(fecha)} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Profesional a cargo</label>
                                <ShadcnInput
                                    value={observacionesPrecio}
                                    placeholder="Ej: Dra. Andrea Morán"
                                    onChange={(e) => setObservacionesPrecio(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campos dinámicos de la plantilla */}
                    {plantillaCompleta && plantillaCompleta.categorias.map(categoria => (
                        <div key={categoria.id_categoria}>
                            <div className="flex items-center gap-3 border-t border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                                    </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">{categoria.nombre}</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                {categoria.campos.map(campo => (
                                    <div key={campo.id_campo}>
                                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                            {campo.nombre}
                                            {campo.requerido === 1 && <span className="text-red-400 ml-1 normal-case">*</span>}
                                        </label>
                                        <Textarea
                                            className="min-h-[100px] resize-y border-slate-200 focus:border-[#6E56CF] focus:ring-violet-100"
                                            value={datosDinamicos[campo.id_campo] || ""}
                                            onChange={(e) => setDatosDinamicos(prev => ({ ...prev, [campo.id_campo]: e.target.value }))}
                                            placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
                                            disabled={mejorandoRedaccion}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Estado vacío: sin plantilla seleccionada */}
                    {!plantillaCompleta && (
                        <div className="border-t border-slate-100 p-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#6E56CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Seleccione una plantilla para ver los campos del formulario</p>
                            <p className="mt-1 text-xs text-slate-400">La plantilla determina qué datos clínicos se registrarán en esta ficha</p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={mejorarRedaccionConCortex}
                            disabled={!hayCamposParaMejorar || mejorandoRedaccion}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-[#6E56CF] shadow-sm transition-all hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:mr-auto sm:w-auto"
                        >
                            {mejorandoRedaccion ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-[#6E56CF]" aria-hidden="true" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
                                </svg>
                            )}
                            {mejorandoRedaccion ? "Cortex está mejorando..." : "Mejorar redacción con Cortex"}
                        </button>
                        <Link href="/dashboard/FichaClinica">
                            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                                Cancelar
                            </button>
                        </Link>
                        <button
                            onClick={() => insertarFicha()}
                            disabled={mejorandoRedaccion}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#6E56CF] hover:bg-[#5B47B0] rounded-xl transition-all shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Guardar Ficha Clínica
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
