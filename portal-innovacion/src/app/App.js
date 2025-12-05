import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import 'animate.css/animate.min.css';
import { WOW } from 'wowjs';
import ProtectedRoute from '../routes/ProtectedRoute';

import Preloader from '../components/Preloader';
import ScrollToTop from '../components/ScrollToTop';
import LoadTop from '../components/ScrollToTop/LoadTop';
import Layout from '../components/Layout/index';
import {
  HiChartBar,
  HiUserGroup,
  HiCalendarDays,
  HiInformationCircle,
  HiClock
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
  Paciente,
  ResetPassword,
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
} from '../pages';
import MainPage from '../pages/home';
import Docente from '../pages/docente';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const params = useParams();

  //preloader
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  //Initialize wow
  useEffect(() => {
    new WOW({ live: false, animateClass: 'animate__animated' }).init();
  }, [location]);

  const currentPatientId = params.id;

  // Rutas doctor
  const routes_doctor = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <HiChartBar size={22} />,
      title: 'Bienvenida al Dashboard',
      breadcrumb: 'Página Principal / Dashboard',
    },
    {
      path: '/pacientes',
      label: 'Pacientes',
      icon: <HiUserGroup size={22} />,
      title: 'Gestión de Pacientes',
      breadcrumb: 'Página Principal / Pacientes',
    },
    {
      path: '/citas',
      label: 'Citas',
      icon: <HiCalendarDays size={22} />,
      title: 'Calendario de Citas',
      breadcrumb: 'Página Principal / Citas',
    },
    {
      path: '/horarios',
      label: 'Horarios',
      icon: <HiClock size={22} />,
      title: 'Horarios de Atención',
      breadcrumb: 'Página Principal / horarios de atención',
    },
    
  ];

  // Rutas paciente específico
  const routes_pacienteEspecifico = [
    {
      path: `/paciente-perfil/${currentPatientId}/informacion-general`,
      label: 'Información General',
      icon: <HiInformationCircle size={22} />,
      title: 'Informacion General',
      breadcrumb: 'Página Principal / Información General',
    },
    {
      path: `/paciente-perfil/${currentPatientId}/historial-medico`,
      label: 'Historial Médico',
      icon: <RiFileHistoryFill size={22} />,
      title: 'Historial Médico',
      breadcrumb: 'Página Principal / Historial Médico',
    },
    {
      path: `/paciente-perfil/${currentPatientId}/examenes`,
      label: 'Exámenes',
      icon: <GrDocumentTest size={22} />,
      title: 'Exámenes',
      breadcrumb: 'Página Principal / Exámenes',
    }
  ];

  return (
    <div className="App">
      {isLoading && <Preloader />}
      <ScrollToTop />
      <LoadTop />
      <Routes>
        <Route path="/" element={<MainPage/>} />
        <Route path="/about-us" element={<About />} />
        <Route path="/agendar-cita" element={<AgendarCita />} />
        <Route path="/event" element={<Event />} />
        <Route path="/event-details" element={<EventDetails />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/teacher-details" element={<TeacherDetails />} />
        <Route path="/instructor-registration" element={<InstructorRegistration />}/>
        <Route path="/student-registration" element={<StudentRegistration />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signupdoc" element={<SignUpDoc />} />
  
        <Route path="/signin" element={<SignIn />} />
        <Route path="/two-verification" element={<TwoVerificationMain />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/registro-docente" element={<Docente />} />
        <Route path="/blog-1" element={<Blog />} />
        <Route path="/blog-2" element={<BlogTwo />} />
        <Route path="/blog-sidebar" element={<BlogSidebar />} />
        <Route path="/blog-details" element={<BlogDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/malla" element={<MallaPage/>} />
        <Route path="/alumni" element={<AlumniMain />} />
        <Route path="/centro" element={<CentroMain />} />
        <Route path="/news" element={<News/>}/>
        <Route path="/news-details/:id" element={<NewsDetails />} />
        <Route path="/sce" element={<ScePage/>}/>
        <Route path="/oportunidades" element={<OportunidadPage/>}/>
        <Route path="/sandbox" element={<Sandbox/>}/>

        <Route
          path="/paciente"
          element={
            <ProtectedRoute allow={["paciente"]}>
              <Paciente />
            </ProtectedRoute>
          }
        />
   
        <Route
          path="/*"
          element={
            <ProtectedRoute allow={["medico"]}>
              <Layout routes={routes_doctor}>
                <Routes>
                  <Route path="citas" element={<Medico />} />
                  <Route path="pacientes" element={<PatientManagement />} />
                  <Route path="horarios" element={<HorariosMain/>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/paciente-perfil/:id/*"
          element={
            <ProtectedRoute allow={["medico"]}>
              <Layout 
                routes={routes_pacienteEspecifico}
              >
                <Routes>
                  <Route path="informacion-general" element={<PatientDetailView />} />
                  <Route path="historial-medico" element={<MedicalHistory />} />
                  <Route path="historial-medico/consulta/:consultaId" element={<ConsultationDetailView />} />
                  <Route path="examenes" element={<div>Exámenes</div>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}

export default App;
