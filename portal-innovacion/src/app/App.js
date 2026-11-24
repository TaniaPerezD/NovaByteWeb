import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import 'animate.css/animate.min.css';
import { WOW } from 'wowjs';
import ProtectedRoute from '../routes/ProtectedRoute';
import AvisoMantenimiento from '../components/AvisoMantenimiento';
import ControlSesion from '../components/ControlSesion';
import RecordatorioSeguridad from '../components/RecordatorioSeguridad';

import Preloader from '../components/Preloader';
import ScrollToTop from '../components/ScrollToTop';
import LoadTop from '../components/ScrollToTop/LoadTop';
import Layout from '../components/Layout/index';
import {
  HiChartBar,
  HiUserGroup,
  HiCalendarDays,
  HiInformationCircle,
  HiClock,
  HiShieldCheck,
  HiBellAlert,
  HiExclamationTriangle
} from 'react-icons/hi2';
import { GrDocumentTest } from "react-icons/gr";
import { RiFileHistoryFill } from "react-icons/ri";

import {
  About,
  AgendarCita,
  Blog,
  BlogDetails,
  BlogSidebar,
  BlogTwo,
  Contact,
  Error,
  Event,
  EventDetails,
  Faq,
  HorariosMain,
  InstructorRegistration,
  SignIn,
  SignUp,
  SignUpDoc,
  StudentRegistration,
  Teacher,
  TeacherDetails,
  Medico,
  MedicoAdmin,
  Paciente,
  ResetPassword,
  Desbloquear,
  Terminos,
  MiActividad,
  TwoVerificationMain,
  NewPassword,
  MallaPage,
  AlumniMain,
  CentroMain,
  News,
  NewsDetails,
  ScePage,
  OportunidadPage,
  Sandbox,
  PatientManagement,
  PatientDetailView,
  MedicalHistory,
  ConsultationDetailView,
  Dashboard,
  ConsultationMedicDetailView,
  Reportes,
  Consentimientos,
  MiPrivacidad,
  Privacidad,
  Seguridad,
  SolicitudesDerechos,
  AlertasSeguridad,
  Incidentes,
  Recepcion,
  Direccion,
  MatrizRoles,
  Cumplimiento,
  AltaPersonal,
  SinModulos,
  Acuse,
  ReportarEvento,
  ModeloPage,
  CamaraPage

} from '../pages';
import MainPage from '../pages/home';
import Docente from '../pages/docente';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // preloader
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Initialize wow
  useEffect(() => {
    new WOW({ live: false, animateClass: 'animate__animated' }).init();
  }, [location]);

  // Rutas doctor (compartidas entre medico y medicoAdmin)
  const routes_doctor = [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: <HiChartBar size={22} />,
      title: 'Bienvenida al Dashboard',
      breadcrumb: 'Página Principal / Dashboard',
    },
    {
      path: 'pacientes',
      label: 'Pacientes',
      icon: <HiUserGroup size={22} />,
      title: 'Gestión de Pacientes',
      breadcrumb: 'Página Principal / Pacientes',
    },
    {
      path: 'citas',
      label: 'Citas',
      icon: <HiCalendarDays size={22} />,
      title: 'Calendario de Citas',
      breadcrumb: 'Página Principal / Citas',
    },
    {
      path: 'horarios',
      label: 'Horarios',
      icon: <HiClock size={22} />,
      title: 'Horarios de Atención',
      breadcrumb: 'Página Principal / Horarios de atención',
    },
  ];

  const routes_doctor_admin = [
    ...routes_doctor,
    {
      path: 'agregar-medico',
      label: 'Agregar Médico',
      icon: <HiUserGroup size={22} />,
      title: 'Registrar Médico',
      breadcrumb: 'Página Principal / Registrar Médico',
    },
    {
      path: 'reportes',
      label: 'Reportes',
      icon: <GrDocumentTest size={22} />,
      title: 'Gestión de Reportes',
      breadcrumb: 'Página Principal / Reportes',
    },
    {
      path: 'derechos',
      label: 'Derechos de pacientes',
      icon: <HiShieldCheck size={22} />,
      title: 'Derechos de las pacientes',
      breadcrumb: 'Página Principal / Derechos de pacientes',
    },
    {
      path: 'alertas',
      label: 'Alertas de seguridad',
      icon: <HiBellAlert size={22} />,
      title: 'Alertas de seguridad',
      breadcrumb: 'Página Principal / Alertas de seguridad',
    },
    {
      path: 'incidentes',
      label: 'Incidentes',
      icon: <HiExclamationTriangle size={22} />,
      title: 'Incidentes de seguridad',
      breadcrumb: 'Página Principal / Incidentes',
    },
    {
      path: 'cumplimiento',
      label: 'Cumplimiento',
      icon: <HiShieldCheck size={22} />,
      title: 'Retención, actas y avisos',
      breadcrumb: 'Página Principal / Cumplimiento',
    },
    {
      path: 'alta-personal',
      label: 'Alta de personal',
      icon: <HiUserGroup size={22} />,
      title: 'Alta de personal',
      breadcrumb: 'Página Principal / Alta de personal',
    },
    {
      path: 'personal',
      label: 'Personal y roles',
      icon: <HiUserGroup size={22} />,
      title: 'Personal y roles',
      breadcrumb: 'Página Principal / Personal y roles',
    }
  ];

  const routes_recepcion = [
    { path: 'agenda', label: 'Agenda', icon: <HiCalendarDays size={22} />, title: 'Agenda de citas', breadcrumb: 'Página Principal / Agenda' },
  ];
  const routes_direccion = [
    { path: 'panel', label: 'Panel', icon: <HiChartBar size={22} />, title: 'Panel de Dirección', breadcrumb: 'Página Principal / Panel' },
    { path: 'matriz', label: 'Matriz de roles', icon: <HiShieldCheck size={22} />, title: 'Matriz de roles y permisos', breadcrumb: 'Página Principal / Matriz de roles' },
  ];
  const routes_osi = [
    { path: 'alertas', label: 'Alertas de seguridad', icon: <HiBellAlert size={22} />, title: 'Alertas de seguridad', breadcrumb: 'Página Principal / Alertas de seguridad' },
    { path: 'incidentes', label: 'Incidentes', icon: <HiExclamationTriangle size={22} />, title: 'Incidentes de seguridad', breadcrumb: 'Página Principal / Incidentes' },
    { path: 'derechos', label: 'Derechos de pacientes', icon: <HiShieldCheck size={22} />, title: 'Derechos de las pacientes', breadcrumb: 'Página Principal / Derechos de pacientes' },
    { path: 'matriz', label: 'Matriz de roles', icon: <HiUserGroup size={22} />, title: 'Matriz de roles y permisos', breadcrumb: 'Página Principal / Matriz de roles' },
    { path: 'cumplimiento', label: 'Cumplimiento', icon: <HiShieldCheck size={22} />, title: 'Retención, actas y avisos', breadcrumb: 'Página Principal / Cumplimiento' },
  ];
  const routes_soporte = [
    { path: 'alta', label: 'Alta de personal', icon: <HiUserGroup size={22} />, title: 'Alta de personal', breadcrumb: 'Página Principal / Alta de personal' },
    { path: 'matriz', label: 'Matriz de roles', icon: <HiShieldCheck size={22} />, title: 'Matriz de roles y permisos', breadcrumb: 'Página Principal / Matriz de roles' },
  ];

  const routes_pacienteEspecifico = [
    {
      path: 'informacion-general',
      label: 'Información General',
      icon: <HiInformationCircle size={22} />,
      title: 'Información General',
      breadcrumb: 'Página Principal / Información General',
    },
    {
      path: 'historial-medico',
      label: 'Historial Médico',
      icon: <RiFileHistoryFill size={22} />,
      title: 'Historial Médico',
      breadcrumb: 'Página Principal / Historial Médico',
    }
  ];

  return (
    <div className="App">
      {isLoading && <Preloader />}
      <ScrollToTop />
      <LoadTop />

      <ControlSesion />
      <AvisoMantenimiento />
      <RecordatorioSeguridad />
      <Routes>
        {/* públicas */}
        <Route path="/" element={<MainPage />} />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute allow={['medico', 'medicoAdmin']}>
              <Reportes />
            </ProtectedRoute>
          }
        />
        <Route path="/about-us" element={<About />} />
        <Route
          path="/agendar-cita"
          element={
            <ProtectedRoute>
              <AgendarCita />
            </ProtectedRoute>
          }
        />
        <Route path="/event" element={<Event />} />
        <Route path="/event-details" element={<EventDetails />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/teacher-details" element={<TeacherDetails />} />
        <Route path="/instructor-registration" element={<InstructorRegistration />} />
        <Route path="/student-registration" element={<StudentRegistration />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/signupdoc"
          element={
            <ProtectedRoute allow={['medicoAdmin']}>
              <SignUpDoc />
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/two-verification" element={<TwoVerificationMain />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/desbloquear" element={<Desbloquear />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/consentimientos" element={<Consentimientos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/seguridad" element={<Seguridad />} />
        <Route path="/acuse" element={<Acuse />} />
        <Route
          path="/reportar-evento"
          element={
            <ProtectedRoute>
              <ReportarEvento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mi-privacidad"
          element={
            <ProtectedRoute allow={['paciente']}>
              <MiPrivacidad />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mi-actividad"
          element={
            <ProtectedRoute>
              <MiActividad />
            </ProtectedRoute>
          }
        />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/registro-docente" element={<Docente />} />
        <Route path="/blog-1" element={<Blog />} />
        <Route path="/blog-2" element={<BlogTwo />} />
        <Route path="/blog-sidebar" element={<BlogSidebar />} />
        <Route path="/blog-details" element={<BlogDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/malla" element={<MallaPage />} />
        <Route path="/alumni" element={<AlumniMain />} />
        <Route path="/centro" element={<CentroMain />} />
        <Route path="/news" element={<News />} />
        <Route path="/news-details/:id" element={<NewsDetails />} />
        <Route path="/sce" element={<ScePage />} />
        <Route path="/oportunidades" element={<OportunidadPage />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/modelo" element={<ModeloPage />} />
        <Route path="/camara-guiada" element={<CamaraPage />} />

        {/* panel paciente */}
        <Route
          path="/paciente"
          element={
            <ProtectedRoute allow={['paciente']}>
              <Paciente />
            </ProtectedRoute>
          }
        />

        {/* panel médico (medico y medicoAdmin comparten esto) */}
        <Route
          path="/medico/*"
          element={
            <ProtectedRoute allow={['medico', 'medicoAdmin']}>
              <Layout routes={routes_doctor}>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="citas" element={<Medico />} />
                  <Route path="pacientes" element={<PatientManagement />} />
                  <Route index element={<Navigate to="citas" replace />} />
                  <Route path="horarios" element={<HorariosMain />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* panel extra para medicoAdmin */}
        <Route
          path="/medico-admin/*"
          element={
            <ProtectedRoute allow={['medicoAdmin']}>
              <Layout routes={routes_doctor_admin}>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route index element={<Navigate to="citas" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="citas" element={<MedicoAdmin />} />
                  <Route path="pacientes" element={<PatientManagement />} />
                  <Route path="horarios" element={<HorariosMain />} />
                  <Route path="agregar-medico" element={<SignUpDoc />} />
                  <Route path="reportes" element={<Reportes />} />
                  <Route path="derechos" element={<SolicitudesDerechos />} />
                  <Route path="alertas" element={<AlertasSeguridad />} />
                  <Route path="incidentes" element={<Incidentes />} />
                  <Route path="personal" element={<MatrizRoles />} />
                  <Route path="alta-personal" element={<AltaPersonal />} />
                  <Route path="cumplimiento" element={<Cumplimiento />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* roles de la matriz NB-MAT-P3-07 */}
        <Route
          path="/recepcion/*"
          element={
            <ProtectedRoute allow={['recepcion']}>
              <Layout routes={routes_recepcion}>
                <Routes>
                  <Route index element={<Navigate to="agenda" replace />} />
                  <Route path="agenda" element={<Recepcion />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/direccion/*"
          element={
            <ProtectedRoute allow={['director']}>
              <Layout routes={routes_direccion}>
                <Routes>
                  <Route index element={<Navigate to="panel" replace />} />
                  <Route path="panel" element={<Direccion />} />
                  <Route path="matriz" element={<MatrizRoles />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seguridad-osi/*"
          element={
            <ProtectedRoute allow={['osi']}>
              <Layout routes={routes_osi}>
                <Routes>
                  <Route index element={<Navigate to="alertas" replace />} />
                  <Route path="alertas" element={<AlertasSeguridad />} />
                  <Route path="incidentes" element={<Incidentes />} />
                  <Route path="derechos" element={<SolicitudesDerechos />} />
                  <Route path="matriz" element={<MatrizRoles />} />
                  <Route path="cumplimiento" element={<Cumplimiento />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal/*"
          element={
            <ProtectedRoute allow={['soporte']}>
              <Layout routes={routes_soporte}>
                <Routes>
                  <Route index element={<Navigate to="alta" replace />} />
                  <Route path="alta" element={<AltaPersonal />} />
                  <Route path="matriz" element={<MatrizRoles />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sin-modulos"
          element={
            <ProtectedRoute allow={['desarrollador', 'dba', 'infra', 'ml']}>
              <SinModulos />
            </ProtectedRoute>
          }
        />

        {/* perfil de paciente (permitimos medico y medicoAdmin) */}
        <Route
          path="/paciente-perfil/:id/*"
          element={
            <ProtectedRoute allow={['medico', 'medicoAdmin']}>
              <Layout routes={routes_pacienteEspecifico}>
                <Routes>
                  <Route index element={<Navigate to="informacion-general" replace />} />
                  <Route path="informacion-general" element={<PatientDetailView />} />
                  <Route path="historial-medico" element={<MedicalHistory />} />
                  <Route path="historial-medico/consulta/:consultaId" element={<ConsultationDetailView />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* catch-all */}
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}

export default App;