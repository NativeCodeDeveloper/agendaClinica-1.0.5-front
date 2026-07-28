"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    ClipboardPlus,
    FileText,
    Mail,
    Phone,
    Plus,
    Search,
    Stethoscope,
    Trash2,
    UserRound,
    X
} from "lucide-react";
import {toast, Toaster} from "react-hot-toast";

function estadosLetra_interpretacion(estado_backend){
    switch (estado_backend) {
        case 1:
            return { etiqueta: "Activa", clases: "border-violet-200 bg-violet-50 text-violet-700" }
        case 2:
            return { etiqueta: "Tratamiento en curso", clases: "border-sky-200 bg-sky-50 text-sky-700" }
        case 3:
            return { etiqueta: "Tratamiento finalizado", clases: "border-emerald-200 bg-emerald-50 text-emerald-700" }
        default:
            return { etiqueta: "Sin estado", clases: "border-slate-200 bg-slate-50 text-slate-600" }
    }
}

function formatearMonto(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearFechaHora(fechaISO) {
    if (!fechaISO) return "";

    return new Date(fechaISO).toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Santiago"
    });
}



   export default function CotizacionesPaciente() {


    const API = process.env.NEXT_PUBLIC_API_URL;


    const {id_paciente} = useParams();
    const router = useRouter();

    //Estado para almacenar la información de la tabla Cotizacion Data Paciente\
    const[cotizacionesPaciente, setCotizacionesPaciente] = useState([])

    // Controla si el formulario visual de una nueva cotización está visible.
    const [mostrarFormularioCotizacion, actualizarVisibilidadFormulario] = useState(false);



    function volverACarpetaClinica() {
        router.push(`/dashboard/FichasPacientes/${id_paciente}`);
    }

    async function buscarPaciente(id_paciente) {
        try {

            const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente`,{
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id_paciente
                }),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error(`No se ha podido cargar los datos del paciente`);
            }

            const dataCotizaciones_paciente = await res.json();
            setCotizacionesPaciente(dataCotizaciones_paciente);

        }catch (error) {
            console.log(error);
            return toast.error(error.message);
        }
    }


    const [nombre_cotizacion, setNombre_cotizacion] = useState("");
    const [profesional_solicitante_nombre, setProfesional_solicitante_nombre] = useState("");


    async function crearNuevaCotizacion(
        nombre_cotizacion,
        profesional_solicitante_nombre,
        id_paciente
        ) {
        try {

            const res = await fetch(`${API}/cotizacionPaciente/insertarCotizacion`,{
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre_cotizacion,
                    profesional_solicitante_nombre,
                    total_presupuesto_cotizado : 0,
                    id_paciente
                }),
                mode: "cors",
                cache: "no-cache"
            })

            if (!res.ok) {
                return toast.error(`No se ha podido crear nueva cotizacion`);
            }

            const respuestaBackend = await res.json();

            if (respuestaBackend.message === true) {
                await buscarPaciente(id_paciente);
                setNombre_cotizacion("");
                actualizarVisibilidadFormulario(false);
                return toast.success(`Cotizacion Creada!`);
            }

            if (respuestaBackend.message === false) {
                return toast.error(`No se ha podido crear nueva Cotizacion`);
            }

            if (respuestaBackend.message === `sindata`) {
                return toast.error(`Faltan datos para crear la nueva cotizacion`);
            }

            else{
                return toast.error(`Ha ocurrido un error contacte a soporte`);
            }

        }catch (error) {
            console.log(error);
            return toast.error(`Ha ocurrido un error en servidor contacte a soporte`);
        }
    }



    useEffect(() => {
        buscarPaciente(id_paciente)
    },[id_paciente])



       const [profesionales, setProfesionales] = useState([]);
       async function buscarProfesionales() {
           try {

               const res = await fetch(`${API}/profesionales/seleccionarTodosProfesionales`,{
                   method: "GET",
                   headers: {
                       Accept: "application/json"
                   },
                   mode  : "cors",
                   cache : "no-cache"
               })

               if (!res.ok) {
                   return toast.error(`No se ha podido encontrar profesionales en el sistema, Problema Interno`);
               }

               const dataProfesionales = await res.json();
               setProfesionales(dataProfesionales);

           }catch (error) {
               console.log(error);
               return toast.error(error.message);
           }
       }

       useEffect(() => {
           buscarProfesionales();
       },[])

       useEffect(() => {
           if (!profesional_solicitante_nombre && profesionales.length > 0) {
               setProfesional_solicitante_nombre(profesionales[0].nombreProfesional);
           }
       },[profesionales, profesional_solicitante_nombre])


       const [paciente, setPaciente] = useState([]);
       async function buscarDatosPacientes(id_paciente){
           try {
               const res = await fetch(`${API}/pacientes/pacientesEspecifico`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               if(!res.ok) {
                   return toast.error(`No se han podido cargar los datos del paciente, Sin respuesta del Servidor`);
               }

               const dataPaciente = await res.json();
               setPaciente(dataPaciente);


           }catch (error) {
               return toast.error(`No se han podido cargar los datos del paciente. Sin respuesta del Servidor`);
           }
       }

       useEffect(() => {
           buscarDatosPacientes(id_paciente)
       },[id_paciente])




       async function eliminarCotizacion(id_cotizacion_paciente){
           try {

               if(!id_cotizacion_paciente){
                   return toast.error(`Debe seleccionar una cotizacion para que esta sea eliminada`);
               }

               const res = await fetch(`${API}/cotizacionPaciente/eliminarCotizacion`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_cotizacion_paciente,
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               if(!res.ok) {
                   return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
               }

               const success = await res.json();

               if(success){
                   await  buscarPaciente(id_paciente);
                   return toast.success(`Cotizacion eliminada!`);

               }else{
                   return toast.error(`No se ha podido eliminar cotizacion. Intente mas tarde`);
               }

           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }


       const [estado, setEstado] = useState("");
       async function seleccionarPorEstado(id_paciente,estado_cotizacion){
           try {
               if(!id_paciente || !estado_cotizacion){
                   return toast.error(`Debe seleccionar un estado para poder aplicar el filtro por estado`);
               }

               if(estado_cotizacion ==="todas" ){
                  await buscarPaciente(id_paciente);
                   return;
               }
               const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente_porEstado`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente,
                       estado_cotizacion
                   }),
                   mode  : "cors",
                   cache : "no-cache"
                   })
               if(!res.ok) {
                   return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
               }
               const dataCotizaciones = await res.json();
               setCotizacionesPaciente(dataCotizaciones);
           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }


       const [profesionalSimilitud, setProfesionalSimilitud] = useState("")
       async function buscarSimilitudProfesional(id_paciente,profesional_solicitante_nombre){

           if(!profesional_solicitante_nombre || profesional_solicitante_nombre===""){
              await buscarPaciente(id_paciente);
              return;
           }

           try {
               const res = await fetch(`${API}/cotizacionPaciente/seleccionar_cotizaciones_paciente_profesional`,{
                   method: "POST",
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                       id_paciente,
                       profesional_solicitante_nombre
                   }),
                   mode  : "cors",
                   cache : "no-cache"
               })

               const data_busqueda_profesionales = await res.json();
               setCotizacionesPaciente(data_busqueda_profesionales);

           }catch (error) {
               return toast.error(`Ha ocurrido un error en el servidor. Contacte a soporte`);
           }
       }



    return (
        <div className="min-h-screen bg-[#FAFAFB] text-slate-900">
            <Toaster></Toaster>
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-10 2xl:max-w-none">
                <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={volverACarpetaClinica}
                            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-[#6E56CF]"
                            title="Volver a la carpeta clínica"
                            aria-label="Volver a la carpeta clínica"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                        </button>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6E56CF]">
                                Gestión financiera del paciente
                            </p>
                            {
                                paciente?.map(paciente => {
                                    return (
                                        <h1 key={paciente.id_paciente} className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">
                                            Cotizaciones de <span className="text-[#6E56CF]">{paciente.nombre}</span>
                                        </h1>
                                    )
                                })
                            }
                            <p className="mt-2 max-w-2xl text-[13px] text-slate-500">
                                Historial de propuestas clínicas, prestaciones incluidas y vigencia de cada documento.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-[52px] sm:pl-14 xl:pl-0">
                        <div className="flex h-14 min-w-[122px] flex-col justify-center rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cotizaciones</span>
                            <span className="mt-1 text-sm font-bold leading-none text-slate-900">{cotizacionesPaciente.length} registros</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => actualizarVisibilidadFormulario((actual) => !actual)}
                            className="flex h-14 items-center gap-2 rounded-lg bg-[#6E56CF] px-5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#5b45bc]"
                        >
                            {mostrarFormularioCotizacion ? <X className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
                            {mostrarFormularioCotizacion ? "Cerrar" : "Nueva cotización"}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:gap-8">
                    <aside className="self-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
                        <div className="border-b border-slate-100 bg-slate-50/60 p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] text-lg font-bold text-white shadow-sm">
                                    CR
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[16px] font-bold text-slate-900">
                                        {cotizacionesPaciente.nombre} {cotizacionesPaciente.apellido}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Paciente #{id_paciente || "MOCK"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {paciente.map((elemento, index) => {
                            return (
                            <div key={index} className="p-5">
                                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Datos del paciente
                                </p>
                                <dl className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <UserRound className="h-4 w-4 shrink-0 text-[#6E56CF]"/>
                                        <div>
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RUT</dt>
                                            <dd className="mt-0.5 font-mono text-[13px] font-semibold text-slate-700">{elemento.rut}</dd>
                                        </div>
                                    </div>


                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 shrink-0 text-[#6E56CF]"/>
                                        <div>
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teléfono</dt>
                                            <dd className="mt-0.5 text-[13px] font-semibold text-slate-700">{elemento.telefono}</dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#6E56CF]"/>
                                        <div className="min-w-0">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Correo</dt>
                                            <dd className="mt-0.5 break-all text-[13px] font-semibold text-slate-700">{elemento.correo}</dd>
                                        </div>
                                    </div>
                                </dl>
                            </div>

                            )})}
                    </aside>

                    <main className="min-w-0 space-y-5">
                        {mostrarFormularioCotizacion && (
                            <section className="overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm">
                                <div className="flex items-center gap-3 border-b border-violet-100 bg-violet-50/60 px-5 py-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6E56CF] shadow-sm">
                                        <ClipboardPlus className="h-4 w-4"/>
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-bold text-slate-800">Nueva cotización</h2>
                                        <p className="text-[11px] text-slate-500">Borrador visual para el paciente seleccionado</p>
                                    </div>
                                </div>
                                <form
                                    className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_auto] xl:items-end"
                                    onSubmit={async (event) => {
                                        event.preventDefault();
                                        await crearNuevaCotizacion(
                                            nombre_cotizacion,
                                            profesional_solicitante_nombre,
                                            id_paciente
                                        );
                                    }}
                                >
                                    <label className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre de la cotización</span>
                                        <input
                                            value={nombre_cotizacion}
                                            onChange={(event) => setNombre_cotizacion(event.target.value)}
                                            required
                                            placeholder="Ej: Tratamiento preventivo"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        />
                                    </label>
                                    <label className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Profesional</span>
                                        <select
                                            value={profesional_solicitante_nombre}
                                            onChange={(event) => setProfesional_solicitante_nombre(event.target.value)}
                                            required
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        >
                                            {profesionales.map((profesional) => (
                                                <option key={profesional.id_profesional} value={profesional.nombreProfesional}>
                                                    {profesional.nombreProfesional}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <button
                                        type="submit"
                                        className="h-10 rounded-lg bg-slate-900 px-5 text-[12px] font-bold text-white transition-colors hover:bg-slate-800"
                                    >
                                        Crear Cotizacion
                                    </button>
                                </form>
                            </section>
                        )}

                        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E56CF]">Historial</p>
                                <h2 className="mt-1 text-xl font-bold text-slate-900">Cotizaciones del paciente</h2>
                                <p className="mt-1 text-[12px] text-slate-500">
                                    {cotizacionesPaciente.length} cotizaciones registradas
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="min-w-0 sm:w-52">
                                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</span>
                                    <select
                                        // 1. Usamos e para capturar el valor seleccionado
                                        onChange={(e) => {
                                            const nuevoEstado = e.target.value;
                                             seleccionarPorEstado(id_paciente, nuevoEstado);
                                        }}
                                        defaultValue="todas"
                                        aria_label="Buscar cotizaciones por estado"
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                    >
                                        <option value="todas">Todos los estados</option>
                                        <option value="1">Activa</option>
                                        <option value="2">Tratamiento en curso</option>
                                        <option value="3">Tratamiento finalizado</option>
                                    </select>
                                </label>

                                <label className="min-w-0 sm:w-72">
                                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Profesional</span>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                                        <input
                                            value={profesionalSimilitud}
                                            onChange={(event) => {
                                                const valor = event.target.value;
                                                setProfesionalSimilitud(valor);
                                                buscarSimilitudProfesional(id_paciente,valor);
                                            }}

                                            type="search"
                                            placeholder="Buscar por profesional"
                                            aria-label="Buscar cotizaciones por profesional"
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        />
                                    </div>
                                </label>
                            </div>
                        </section>

                        <div className="space-y-3">
                            {cotizacionesPaciente.map((cotizacion) => {
                                const estadoActual = estadosLetra_interpretacion(cotizacion.estado_cotizacion);


                                return (
                                    <article
                                        key={cotizacion.id_cotizacion_paciente}
                                        className="overflow-hidden rounded-lg border border-slate-200 border-l-4 border-l-[#6E56CF] bg-white shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="p-4 sm:p-5">
                                            <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2 border-b border-slate-100 pb-3 text-[#6E56CF]">
                                                <Stethoscope className="h-4 w-4 shrink-0"/>
                                                <p className="min-w-0 flex-1 text-[13px] font-bold leading-snug sm:text-[14px]">
                                                    {cotizacion.profesional_solicitante_nombre}
                                                </p>
                                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        ID Cotización: <span className="font-mono text-slate-600">{cotizacion.id_cotizacion_paciente}</span>
                                                    </span>
                                                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold  ${estadoActual.clases}`}>
                                                        {estadoActual.etiqueta}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 xl:grid-cols-[minmax(220px,1.4fr)_minmax(115px,0.8fr)_minmax(150px,1fr)_minmax(100px,0.7fr)] xl:items-center">
                                                <div className="col-span-2 flex min-w-0 items-start gap-3 sm:col-span-4 xl:col-span-1">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#6E56CF]">
                                                        <FileText className="h-5 w-5"/>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="break-words text-[15px] font-bold leading-snug text-slate-900">
                                                            {cotizacion.nombre_cotizacion}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fecha creación</p>
                                                    <p className="mt-1 text-[12px] font-semibold text-slate-700">{formatearFechaHora(cotizacion.fecha_creacion)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Última modificación</p>
                                                    <p className="mt-1 text-[12px] font-semibold text-slate-700">{formatearFechaHora(cotizacion.fecha_actualizacion)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                                                    <p className="mt-1 text-[13px] font-bold text-[#6E56CF]">{formatearMonto(cotizacion.total_presupuesto_cotizado)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex w-full flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => router.push(`/dashboard/detalleCotizacion/${cotizacion.id_cotizacion_paciente}`)}
                                                    className="flex h-9 w-full items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 px-4 text-[11px] font-bold text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-[#6E56CF] sm:w-auto"
                                                    aria-label={`Ver detalle de la cotización ${cotizacion.id_cotizacion_paciente}`}
                                                >
                                                    Ver detalle
                                                </button>
                                                <button
                                                    onClick={()=> eliminarCotizacion(cotizacion.id_cotizacion_paciente)}
                                                    type="button"
                                                    className="flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-4 text-[11px] font-bold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 sm:w-auto"
                                                    aria-label={`Eliminar la cotización ${cotizacion.id_cotizacion_paciente}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 shrink-0"/>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}

                            {cotizacionesPaciente.length === 0 && (
                                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
                                    <Search className="h-7 w-7 text-slate-300"/>
                                    <p className="mt-3 text-[13px] font-bold text-slate-700">No hay cotizaciones registradas</p>
                                    <p className="mt-1 text-[12px] text-slate-400">Crea una nueva cotización para este paciente.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
