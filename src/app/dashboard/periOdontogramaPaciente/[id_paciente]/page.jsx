"use client";

import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {toast} from "react-hot-toast";
import {
    ArrowLeft,
    BadgePlus,
    CircleDot,
    Download,
    Droplets,
    Eraser,
    FileText,
    Save,
    ShieldPlus,
    Sparkles,
    Upload,
} from "lucide-react";
import ToasterClient from "@/Componentes/ToasterClient";
import {formatRut} from "@/lib/designTokens";

const DIENTES_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const DIENTES_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const TODOS_LOS_DIENTES = [...DIENTES_SUPERIORES, ...DIENTES_INFERIORES];
const SITIOS_VESTIBULARES = ["distovestibular", "vestibular", "mesiovestibular"];
const SITIOS_PALATINOS_LINGUALES = ["distopalatino", "palatino", "mesiopalatino"];
const SITIOS_COMPLETOS = [...SITIOS_VESTIBULARES, ...SITIOS_PALATINOS_LINGUALES];

const ETIQUETAS_SITIOS = {
    distovestibular: "DV",
    vestibular: "V",
    mesiovestibular: "MV",
    distopalatino: "DP/DL",
    palatino: "P/L",
    mesiopalatino: "MP/ML",
};

const CAMPOS_NUMERICOS = [
    {id: "margenGingival", nombre: "Margen gingival", abreviado: "MG"},
    {id: "profundidadSondaje", nombre: "Profundidad sondaje", abreviado: "PS"},
];

const ANCHO_ETIQUETAS_PERIODONTALES = 240;
const ANCHO_GRAFICO_PERIODONTAL = 950;
const ANCHO_LAMINA_PERIODONTAL = ANCHO_ETIQUETAS_PERIODONTALES + ANCHO_GRAFICO_PERIODONTAL + ANCHO_ETIQUETAS_PERIODONTALES;

function crearSitioPeriodontal() {
    return {
        margenGingival: 0,
        profundidadSondaje: 0,
        sangradoSondaje: false,
        placaBacteriana: false,
    };
}

function crearDientePeriodontal(numeroDiente) {
    const sitios = {};
    SITIOS_COMPLETOS.forEach((sitio) => {
        sitios[sitio] = crearSitioPeriodontal();
    });

    return {
        numeroDiente,
        presente: true,
        implante: false,
        movilidad: "0",
        furcacion: "0",
        nota: "",
        sitios,
    };
}

function crearPeriodontogramaInicial(id_paciente) {
    const dientes = {};
    TODOS_LOS_DIENTES.forEach((numeroDiente) => {
        dientes[String(numeroDiente)] = crearDientePeriodontal(numeroDiente);
    });

    return {
        id_paciente,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        profesionalResponsable: "",
        observacionesGenerales: "",
        dientes,
    };
}

function normalizarPeriodontograma(data, id_paciente) {
    const base = crearPeriodontogramaInicial(id_paciente);
    if (!data || typeof data !== "object") return base;

    const dientes = {...base.dientes};
    Object.entries(data.dientes || {}).forEach(([numeroDiente, diente]) => {
        const sitios = {...dientes[numeroDiente]?.sitios};
        SITIOS_COMPLETOS.forEach((sitio) => {
            sitios[sitio] = {
                ...crearSitioPeriodontal(),
                ...(diente?.sitios?.[sitio] || {}),
                margenGingival: Number(diente?.sitios?.[sitio]?.margenGingival || 0),
                profundidadSondaje: Number(diente?.sitios?.[sitio]?.profundidadSondaje || 0),
                sangradoSondaje: Boolean(diente?.sitios?.[sitio]?.sangradoSondaje),
                placaBacteriana: Boolean(diente?.sitios?.[sitio]?.placaBacteriana),
            };
        });

        dientes[numeroDiente] = {
            ...crearDientePeriodontal(Number(numeroDiente)),
            ...diente,
            numeroDiente: Number(numeroDiente),
            presente: diente?.presente !== false,
            implante: Boolean(diente?.implante),
            movilidad: String(diente?.movilidad ?? "0"),
            furcacion: String(diente?.furcacion ?? "0"),
            nota: diente?.nota || "",
            sitios,
        };
    });

    return {
        ...base,
        ...data,
        id_paciente,
        dientes,
    };
}

function obtenerNivelInsercion(sitio) {
    return Number(sitio.profundidadSondaje || 0) + Number(sitio.margenGingival || 0);
}

function obtenerColorSondaje(valor) {
    const numero = Number(valor || 0);
    if (numero >= 6) return "text-red-700 bg-red-50 border-red-200";
    if (numero >= 5) return "text-amber-700 bg-amber-50 border-amber-200";
    if (numero >= 4) return "text-sky-700 bg-sky-50 border-sky-200";
    return "text-slate-700 bg-white border-slate-200";
}

function obtenerResumen(periodontograma) {
    const sitios = [];
    Object.values(periodontograma.dientes || {}).forEach((diente) => {
        if (!diente.presente) return;
        SITIOS_COMPLETOS.forEach((sitioNombre) => {
            sitios.push(diente.sitios[sitioNombre]);
        });
    });

    const totalSitios = sitios.length || 1;
    const totalProfundidad = sitios.reduce((total, sitio) => total + Number(sitio.profundidadSondaje || 0), 0);
    const totalInsercion = sitios.reduce((total, sitio) => total + obtenerNivelInsercion(sitio), 0);
    const sitiosSeisMm = sitios.filter((sitio) => Number(sitio.profundidadSondaje || 0) >= 6).length;
    const sitiosCincoMm = sitios.filter((sitio) => Number(sitio.profundidadSondaje || 0) === 5).length;
    const bop = sitios.filter((sitio) => sitio.sangradoSondaje).length;
    const placa = sitios.filter((sitio) => sitio.placaBacteriana).length;
    const dientesPresentes = Object.values(periodontograma.dientes || {}).filter((diente) => diente.presente).length;
    const implantes = Object.values(periodontograma.dientes || {}).filter((diente) => diente.implante).length;

    return {
        profundidadMedia: (totalProfundidad / totalSitios).toFixed(1),
        insercionMedia: (totalInsercion / totalSitios).toFixed(1),
        sitiosSeisMm,
        sitiosCincoMm,
        bop: Math.round((bop / totalSitios) * 100),
        placa: Math.round((placa / totalSitios) * 100),
        dientesPresentes,
        implantes,
    };
}

function EntradaNumeroPeriodontal({valor, onChange, ariaLabel, esSondaje = false}) {
    return (
        <input
            aria-label={ariaLabel}
            type="number"
            min="-9"
            max="15"
            value={valor}
            onChange={(evento) => onChange(evento.target.value)}
            readOnly={!onChange}
            className={`h-8 w-full border-0 bg-transparent text-center text-[13px] font-semibold leading-none text-slate-950 outline-none focus:bg-cyan-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                esSondaje ? obtenerColorSondaje(valor).replaceAll("border-", "ring-") : ""
            }`}
        />
    );
}

function CeldaTriple({children}) {
    return (
        <div className="grid h-8 grid-cols-3 divide-x divide-white bg-slate-100">
            {children}
        </div>
    );
}

function CeldaDiente({children, className = ""}) {
    return (
        <td className={`w-[57px] min-w-[57px] border border-slate-700 p-0 align-middle ${className}`}>
            {children}
        </td>
    );
}

function BotonMarcador({activo, onClick, titulo}) {
    return (
        <button
            type="button"
            title={titulo}
            onClick={onClick}
            className={`h-full w-full transition ${activo ? "bg-red-500" : "bg-slate-100 hover:bg-slate-200"}`}
        />
    );
}

function filaTriple({dientes, periodontograma, sitios, campo, actualizarSitio, esSondaje = false}) {
    return dientes.map((numeroDiente) => {
        const diente = periodontograma.dientes[String(numeroDiente)];
        return (
            <CeldaDiente key={`${campo}-${numeroDiente}`}>
                <CeldaTriple>
                    {sitios.map((sitio) => (
                        <EntradaNumeroPeriodontal
                            key={sitio}
                            valor={campo === "nivelInsercion" ? obtenerNivelInsercion(diente.sitios[sitio]) : diente.sitios[sitio][campo]}
                            esSondaje={esSondaje}
                            ariaLabel={`${campo} ${numeroDiente} ${sitio}`}
                            onChange={campo === "nivelInsercion" ? null : (valor) => actualizarSitio(numeroDiente, sitio, campo, valor)}
                        />
                    ))}
                </CeldaTriple>
            </CeldaDiente>
        );
    });
}

function filaMarcador({dientes, periodontograma, sitios, campo, actualizarSitio}) {
    return dientes.map((numeroDiente) => {
        const diente = periodontograma.dientes[String(numeroDiente)];
        return (
            <CeldaDiente key={`${campo}-${numeroDiente}`}>
                <CeldaTriple>
                    {sitios.map((sitio) => (
                        <BotonMarcador
                            key={sitio}
                            activo={diente.sitios[sitio][campo]}
                            titulo={`${campo} ${numeroDiente} ${sitio}`}
                            onClick={() => actualizarSitio(numeroDiente, sitio, campo, !diente.sitios[sitio][campo])}
                        />
                    ))}
                </CeldaTriple>
            </CeldaDiente>
        );
    });
}

function TablaSegmento({dientes, periodontograma, filas, sitios, actualizarSitio, actualizarDiente, mostrarNumeros}) {
    return (
        <table className="border-collapse text-slate-950">
            <tbody>
            {mostrarNumeros && (
                <tr>
                    {dientes.map((numeroDiente) => (
                        <CeldaDiente key={`numero-${numeroDiente}`} className="h-8 bg-slate-100">
                            <button
                                type="button"
                                onClick={() => actualizarDiente(numeroDiente, "presente", !periodontograma.dientes[String(numeroDiente)].presente)}
                                className="h-full w-full text-center text-[17px] font-black"
                                title="Marcar pieza presente/ausente"
                            >
                                {numeroDiente}
                            </button>
                        </CeldaDiente>
                    ))}
                </tr>
            )}
            {filas.map((fila) => (
                <tr key={fila.id}>
                    {fila.tipo === "movilidad" && dientes.map((numeroDiente) => (
                        <CeldaDiente key={`${fila.id}-${numeroDiente}`}>
                            <select
                                value={periodontograma.dientes[String(numeroDiente)].movilidad}
                                onChange={(evento) => actualizarDiente(numeroDiente, "movilidad", evento.target.value)}
                                className="h-8 w-full border-0 bg-transparent text-center text-[13px] font-semibold outline-none"
                            >
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </CeldaDiente>
                    ))}
                    {fila.tipo === "implante" && dientes.map((numeroDiente) => (
                        <CeldaDiente key={`${fila.id}-${numeroDiente}`}>
                            <button
                                type="button"
                                onClick={() => actualizarDiente(numeroDiente, "implante", !periodontograma.dientes[String(numeroDiente)].implante)}
                                className={`h-8 w-full ${periodontograma.dientes[String(numeroDiente)].implante ? "bg-blue-300" : "bg-slate-100 hover:bg-slate-200"}`}
                                title="Marcar implante"
                            />
                        </CeldaDiente>
                    ))}
                    {fila.tipo === "furcacion" && dientes.map((numeroDiente) => (
                        <CeldaDiente key={`${fila.id}-${numeroDiente}`}>
                            <select
                                value={periodontograma.dientes[String(numeroDiente)].furcacion}
                                onChange={(evento) => actualizarDiente(numeroDiente, "furcacion", evento.target.value)}
                                className="h-8 w-full border-0 bg-slate-50 text-center text-[13px] font-semibold outline-none"
                            >
                                <option value="0"></option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </CeldaDiente>
                    ))}
                    {fila.tipo === "triple" && filaTriple({
                        dientes,
                        periodontograma,
                        sitios,
                        campo: fila.campo,
                        actualizarSitio,
                        esSondaje: fila.campo === "profundidadSondaje",
                    })}
                    {fila.tipo === "marcador" && filaMarcador({
                        dientes,
                        periodontograma,
                        sitios,
                        campo: fila.campo,
                        actualizarSitio,
                    })}
                    {fila.tipo === "nota" && dientes.map((numeroDiente) => (
                        <CeldaDiente key={`${fila.id}-${numeroDiente}`}>
                            <input
                                value={periodontograma.dientes[String(numeroDiente)].nota}
                                onChange={(evento) => actualizarDiente(numeroDiente, "nota", evento.target.value)}
                                className="h-8 w-full border-0 bg-transparent px-1 text-center text-[12px] outline-none focus:bg-cyan-50"
                                aria-label={`Nota ${numeroDiente}`}
                            />
                        </CeldaDiente>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function EtiquetasTabla({filas, mostrarEspacioNumero = false}) {
    return (
        <table className="border-collapse">
            <tbody>
            {mostrarEspacioNumero && <tr><td className="h-8 w-[240px]" /></tr>}
            {filas.map((fila) => (
                <tr key={fila.id}>
                    <td className="h-8 w-[240px] pr-4 text-right text-[15px] font-semibold leading-none text-slate-950">
                        {fila.etiqueta}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function TablaPeriodontal({tipo, periodontograma, actualizarSitio, actualizarDiente}) {
    const filasSuperiores = [
        {id: "movilidad", etiqueta: "Movilidad", tipo: "movilidad"},
        {id: "implante", etiqueta: "Implante", tipo: "implante"},
        {id: "furcacion", etiqueta: "Furcación", tipo: "furcacion"},
        {id: "sangrado", etiqueta: "Sangrado al sondaje", tipo: "marcador", campo: "sangradoSondaje"},
        {id: "placa", etiqueta: "Placa", tipo: "marcador", campo: "placaBacteriana"},
        {id: "margen", etiqueta: "Margen gingival", tipo: "triple", campo: "margenGingival"},
        {id: "profundidad", etiqueta: "Profundidad de sondaje", tipo: "triple", campo: "profundidadSondaje"},
        {id: "nivel", etiqueta: "Nivel de inserción", tipo: "triple", campo: "nivelInsercion"},
    ];

    const filasInferiores = [
        {id: "margen", etiqueta: "Margen gingival", tipo: "triple", campo: "margenGingival"},
        {id: "profundidad", etiqueta: "Profundidad de sondaje", tipo: "triple", campo: "profundidadSondaje"},
        {id: "nivel", etiqueta: "Nivel de inserción", tipo: "triple", campo: "nivelInsercion"},
        {id: "placa", etiqueta: "Placa", tipo: "marcador", campo: "placaBacteriana"},
        {id: "sangrado", etiqueta: "Sangrado al sondaje", tipo: "marcador", campo: "sangradoSondaje"},
        {id: "furcacion", etiqueta: "Furcación", tipo: "furcacion"},
        {id: "nota", etiqueta: "Nota", tipo: "nota"},
    ];

    const filas = tipo === "superior" ? filasSuperiores : filasInferiores;
    const sitios = tipo === "superior" ? SITIOS_VESTIBULARES : SITIOS_PALATINOS_LINGUALES;
    const dientes = tipo === "superior" ? DIENTES_SUPERIORES : DIENTES_INFERIORES;
    const mitadIzquierda = dientes.slice(0, 8);
    const mitadDerecha = dientes.slice(8);

    return (
        <div className="flex items-start">
            <EtiquetasTabla filas={filas} mostrarEspacioNumero={tipo === "superior"} />
            <div className="flex items-start gap-[38px]">
                <TablaSegmento
                    dientes={mitadIzquierda}
                    periodontograma={periodontograma}
                    filas={filas}
                    sitios={sitios}
                    actualizarSitio={actualizarSitio}
                    actualizarDiente={actualizarDiente}
                    mostrarNumeros={tipo === "superior"}
                />
                <TablaSegmento
                    dientes={mitadDerecha}
                    periodontograma={periodontograma}
                    filas={filas}
                    sitios={sitios}
                    actualizarSitio={actualizarSitio}
                    actualizarDiente={actualizarDiente}
                    mostrarNumeros={tipo === "superior"}
                />
            </div>
            <div className="w-[240px] shrink-0" aria-hidden="true" />
        </div>
    );
}

function GraficoPeriodontal() {
    return (
        <div className="ml-[240px] w-[950px] py-4">
            <img
                src="/peri2.png"
                alt="Periodontograma base"
                className="block h-auto w-[950px] select-none"
                draggable={false}
            />
        </div>
    );
}

function CampoDocumento({label, value, className = "", onChange, placeholder = ""}) {
    return (
        <label className={`group flex min-w-0 flex-col gap-1.5 ${className}`}>
            <span className="truncate pl-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
            <input
                value={value || ""}
                onChange={(evento) => onChange?.(evento.target.value)}
                placeholder={placeholder}
                className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[13px] font-semibold text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)] outline-none transition duration-200 placeholder:font-normal placeholder:text-slate-300 hover:border-slate-300 focus:border-[#6E56CF] focus:bg-white focus:ring-4 focus:ring-violet-100/70"
            />
        </label>
    );
}

function CheckboxDocumento({label, checked = false, onChange}) {
    return (
        <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-[12px] font-semibold text-slate-600 transition duration-200 hover:border-violet-200 hover:bg-violet-50/40">
            <input
                type="checkbox"
                checked={checked}
                onChange={(evento) => onChange?.(evento.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#6E56CF] accent-[#6E56CF] focus:ring-2 focus:ring-violet-200"
            />
            <span>{label}</span>
        </label>
    );
}

function IconoDiente({className = "", strokeWidth = 2}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M12 2c-2.6 0-4.6 1.9-4.6 4.4 0 1.4.4 2.5.8 3.6.4 1.1.8 2.1.8 3.5 0 1.6-.6 2.5-1.1 3.4-.5.8-.9 1.6-.9 2.8 0 1.1.7 2 1.7 2 .9 0 1.3-.6 1.7-1.6.3-.8.6-1.9 1.6-1.9s1.3 1.1 1.6 1.9c.4 1 .8 1.6 1.7 1.6 1 0 1.7-.9 1.7-2 0-1.2-.4-2-.9-2.8-.5-.9-1.1-1.8-1.1-3.4 0-1.4.4-2.4.8-3.5.4-1.1.8-2.2.8-3.6C16.6 3.9 14.6 2 12 2z" />
        </svg>
    );
}

function formatearFechaDocumento(fecha = new Date()) {
    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(fecha);
}

function CabeceraDocumento({paciente, idPaciente, periodontograma, actualizarCampoGeneral}) {
    const fechaHoy = formatearFechaDocumento();

    return (
        <div className="mb-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-8 border-b border-slate-100 bg-slate-50/60 px-7 py-6">
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E56CF]">Registro clínico dental</p>
                    <h1 className="text-[28px] font-black leading-none tracking-[-0.035em] text-slate-900">Periodontograma</h1>
                </div>
                <div className="flex items-center gap-2.5 border-l-2 border-emerald-500 py-1.5 pl-3">
                    <IconoDiente className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold uppercase leading-none tracking-[0.16em] text-slate-500">Registro activo</span>
                </div>
            </div>

            <div className="space-y-5 px-7 py-6">
                <div className="grid grid-cols-[280px_1fr_190px] items-end gap-5">
                    <CampoDocumento
                        label="ID del paciente"
                        value={idPaciente ? `P-${idPaciente}` : ""}
                        onChange={() => {}}
                        placeholder="P-0000"
                    />
                    <div aria-hidden="true" />
                    <CampoDocumento label="Fecha" value={fechaHoy} onChange={() => {}} />
                </div>

                <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-5">
                    <CampoDocumento
                        label="Apellidos del paciente"
                        value={paciente?.apellido || ""}
                        onChange={() => {}}
                    />
                    <CampoDocumento
                        label="Nombre"
                        value={paciente?.nombre || ""}
                        onChange={() => {}}
                    />
                    <CampoDocumento
                        label="Fecha de nacimiento"
                        value={paciente?.nacimiento ? formatearFechaDocumento(new Date(paciente.nacimiento)) : fechaHoy}
                        onChange={() => {}}
                    />
                </div>

                <div className="grid grid-cols-[190px_190px_1fr] items-end gap-5 border-t border-slate-100 pt-5">
                    <CheckboxDocumento label="Examen inicial" />
                    <CheckboxDocumento label="Reevaluación" />
                    <CampoDocumento
                        label="Clínico"
                        value={periodontograma.profesionalResponsable}
                        onChange={(valor) => actualizarCampoGeneral("profesionalResponsable", valor)}
                    />
                </div>
            </div>
        </div>
    );
}

function BarraResumenDocumento({resumen}) {
    return (
        <div className="mt-2 flex items-center justify-center">
            <div className="relative flex h-7 min-w-[760px] items-center justify-center gap-12 border-2 border-black bg-white px-8 text-[13px] text-black">
                <span>Profundidad media de sondaje: <strong>{resumen.profundidadMedia} mm</strong></span>
                <span>Nivel medio de inserción: <strong>{resumen.insercionMedia} mm</strong></span>
                <span>BOP: <strong>{resumen.bop}%</strong></span>
                <span>PI: <strong>{resumen.placa}%</strong></span>
            </div>
        </div>
    );
}

function PeriodontogramaLamina({periodontograma, actualizarSitio, actualizarDiente, resumen}) {
    return (
        <section className="bg-white py-4">
            <div
                className="mx-auto font-[Arial]"
                style={{
                    width: `${ANCHO_LAMINA_PERIODONTAL}px`,
                    minWidth: `${ANCHO_LAMINA_PERIODONTAL}px`,
                }}
            >
                    <TablaPeriodontal
                        tipo="superior"
                        periodontograma={periodontograma}
                        actualizarSitio={actualizarSitio}
                        actualizarDiente={actualizarDiente}
                    />
                    <GraficoPeriodontal />
                    <TablaPeriodontal
                        tipo="inferior"
                        periodontograma={periodontograma}
                        actualizarSitio={actualizarSitio}
                        actualizarDiente={actualizarDiente}
                    />
                    <BarraResumenDocumento resumen={resumen} />
            </div>
        </section>
    );
}

export default function PeriOdontogramaPaciente() {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const {id_paciente} = useParams();
    const [dataPaciente, setDataPaciente] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodontograma, setPeriodontograma] = useState(null);
    const [guardadoAutomatico, setGuardadoAutomatico] = useState("");

    const medidorLaminaRef = useRef(null);
    const contenidoLaminaRef = useRef(null);
    const [escalaLamina, setEscalaLamina] = useState(1);
    const [alturaLaminaNatural, setAlturaLaminaNatural] = useState(0);

    const claveAlmacenamiento = useMemo(() => {
        return id_paciente ? `periodontograma_paciente_${id_paciente}` : "";
    }, [id_paciente]);

    const resumen = useMemo(() => {
        if (!periodontograma) return null;
        return obtenerResumen(periodontograma);
    }, [periodontograma]);

    useLayoutEffect(() => {
        if (cargando || !periodontograma) return;

        function recalcularEscalaLamina() {
            const anchoDisponible = medidorLaminaRef.current?.clientWidth || ANCHO_LAMINA_PERIODONTAL;
            setEscalaLamina(Math.min(1, anchoDisponible / ANCHO_LAMINA_PERIODONTAL));
            if (contenidoLaminaRef.current) {
                setAlturaLaminaNatural(contenidoLaminaRef.current.offsetHeight);
            }
        }

        recalcularEscalaLamina();

        const observador = new ResizeObserver(recalcularEscalaLamina);
        if (medidorLaminaRef.current) observador.observe(medidorLaminaRef.current);
        window.addEventListener("resize", recalcularEscalaLamina);

        return () => {
            observador.disconnect();
            window.removeEventListener("resize", recalcularEscalaLamina);
        };
    }, [cargando]);

    async function cargarDatosPaciente(idPaciente) {
        try {
            const res = await fetch(`${API}/pacientes/pacientesEspecifico`, {
                method: "POST",
                headers: {Accept: "application/json", "Content-Type": "application/json"},
                mode: "cors",
                body: JSON.stringify({id_paciente: idPaciente}),
            });

            if (!res.ok) {
                return toast.error("No fue posible cargar el paciente");
            }

            const dataBackendPaciente = await res.json();
            setDataPaciente(Array.isArray(dataBackendPaciente) ? dataBackendPaciente : [dataBackendPaciente]);
        } catch (error) {
            return toast.error("No fue posible cargar los datos del paciente");
        }
    }

    function cargarPeriodontogramaPaciente() {
        if (!id_paciente || !claveAlmacenamiento) return;

        try {
            const datosGuardados = window.localStorage.getItem(claveAlmacenamiento);
            if (!datosGuardados) {
                setPeriodontograma(crearPeriodontogramaInicial(id_paciente));
                return;
            }

            const datosParseados = JSON.parse(datosGuardados);
            setPeriodontograma(normalizarPeriodontograma(datosParseados, id_paciente));
        } catch (error) {
            setPeriodontograma(crearPeriodontogramaInicial(id_paciente));
            toast.error("El periodontograma guardado estaba dañado. Se inició uno nuevo.");
        }
    }

    function persistirPeriodontograma(siguientePeriodontograma) {
        const conFecha = {
            ...siguientePeriodontograma,
            fechaActualizacion: new Date().toISOString(),
        };
        setPeriodontograma(conFecha);
        window.localStorage.setItem(claveAlmacenamiento, JSON.stringify(conFecha));
        setGuardadoAutomatico(new Date().toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit"}));
    }

    function actualizarSitio(numeroDiente, sitio, campo, valor) {
        if (!periodontograma) return;

        const valorNormalizado = campo === "sangradoSondaje" || campo === "placaBacteriana"
            ? Boolean(valor)
            : Number(valor);

        const siguientePeriodontograma = {
            ...periodontograma,
            dientes: {
                ...periodontograma.dientes,
                [String(numeroDiente)]: {
                    ...periodontograma.dientes[String(numeroDiente)],
                    sitios: {
                        ...periodontograma.dientes[String(numeroDiente)].sitios,
                        [sitio]: {
                            ...periodontograma.dientes[String(numeroDiente)].sitios[sitio],
                            [campo]: valorNormalizado,
                        },
                    },
                },
            },
        };

        persistirPeriodontograma(siguientePeriodontograma);
    }

    function actualizarDiente(numeroDiente, campo, valor) {
        if (!periodontograma) return;

        const siguientePeriodontograma = {
            ...periodontograma,
            dientes: {
                ...periodontograma.dientes,
                [String(numeroDiente)]: {
                    ...periodontograma.dientes[String(numeroDiente)],
                    [campo]: valor,
                },
            },
        };

        persistirPeriodontograma(siguientePeriodontograma);
    }

    function actualizarCampoGeneral(campo, valor) {
        if (!periodontograma) return;
        persistirPeriodontograma({
            ...periodontograma,
            [campo]: valor,
        });
    }

    function guardarPeriodontograma() {
        if (!periodontograma) return;
        persistirPeriodontograma(periodontograma);
        toast.success("Periodontograma guardado para este paciente");
    }

    function limpiarPeriodontograma() {
        if (!id_paciente) return;
        const nuevoPeriodontograma = crearPeriodontogramaInicial(id_paciente);
        persistirPeriodontograma(nuevoPeriodontograma);
        toast.success("Periodontograma reiniciado");
    }

    function exportarPeriodontograma() {
        if (!periodontograma) return;
        const blob = new Blob([JSON.stringify(periodontograma, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `periodontograma_paciente_${id_paciente}.json`;
        enlace.click();
        URL.revokeObjectURL(url);
    }

    function importarPeriodontograma(evento) {
        const archivo = evento.target.files?.[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = () => {
            try {
                const datos = JSON.parse(String(lector.result));
                const datosNormalizados = normalizarPeriodontograma(datos, id_paciente);
                persistirPeriodontograma(datosNormalizados);
                toast.success("Periodontograma importado correctamente");
            } catch (error) {
                toast.error("El archivo no tiene un formato válido");
            } finally {
                evento.target.value = "";
            }
        };
        lector.readAsText(archivo);
    }

    function volverCarpetaClinica() {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    useEffect(() => {
        if (!id_paciente) return;
        setCargando(true);
        Promise.resolve(cargarDatosPaciente(id_paciente))
            .finally(() => {
                cargarPeriodontogramaPaciente();
                setCargando(false);
            });
    }, [id_paciente, claveAlmacenamiento]);

    const paciente = dataPaciente[0] || null;

    if (cargando || !periodontograma) {
        return (
            <div className="fixed inset-0 z-[100] min-h-screen overflow-auto bg-[#FAFAFB] px-4 py-6 sm:px-6 lg:px-8">
                <ToasterClient />
                <div className="mx-auto flex max-w-7xl flex-col gap-5">
                    <div className="h-28 animate-pulse rounded-[28px] border border-slate-100 bg-white shadow-sm" />
                    <div className="h-64 animate-pulse rounded-[28px] border border-slate-100 bg-white shadow-sm" />
                    <div className="h-64 animate-pulse rounded-[28px] border border-slate-100 bg-white shadow-sm" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] min-h-screen overflow-auto bg-[#FAFAFB] px-4 py-6 sm:px-6 lg:px-8">
            <ToasterClient />
            <div className="mx-auto flex min-h-full max-w-[1540px] flex-col items-center gap-5">
                <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.25)]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Ficha del paciente</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-slate-600">
                            <span className="text-slate-900">{paciente ? `${paciente.nombre || ""} ${paciente.apellido || ""}` : "Paciente"}</span>
                            <span className="text-slate-300">·</span>
                            <span>RUT {formatRut(paciente?.rut) || "-"}</span>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1.5 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Guardado {guardadoAutomatico || "sin cambios"}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={volverCarpetaClinica}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a fichas del paciente
                    </button>
                </div>

                <div className="w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white px-3 py-8 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.3)] sm:px-8 sm:py-10">
                    <div ref={medidorLaminaRef} className="flex w-full justify-center">
                        <div style={{height: alturaLaminaNatural ? `${alturaLaminaNatural * escalaLamina}px` : undefined}}>
                            <div
                                ref={contenidoLaminaRef}
                                style={{
                                    width: `${ANCHO_LAMINA_PERIODONTAL}px`,
                                    transform: `scale(${escalaLamina})`,
                                    transformOrigin: "top center",
                                }}
                            >
                                <CabeceraDocumento
                                    paciente={paciente}
                                    idPaciente={id_paciente}
                                    periodontograma={periodontograma}
                                    actualizarCampoGeneral={actualizarCampoGeneral}
                                />
                                <PeriodontogramaLamina
                                    periodontograma={periodontograma}
                                    actualizarSitio={actualizarSitio}
                                    actualizarDiente={actualizarDiente}
                                    resumen={resumen}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {escalaLamina < 1 && (
                    <p className="text-center text-[11px] font-semibold text-slate-400">
                        Vista ajustada al ancho de pantalla ({Math.round(escalaLamina * 100)}%). Usa una pantalla más grande para ver el detalle a tamaño completo.
                    </p>
                )}
            </div>
        </div>
    );
}
