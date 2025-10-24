import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'animate.css/animate.min.css';
import { WOW } from 'wowjs';

import Preloader from '../components/Preloader';
import ScrollToTop from '../components/ScrollToTop';
import LoadTop from '../components/ScrollToTop/LoadTop';

import {
  About,
  Blog,
  BlogDetails,
  BlogSidebar,
  BlogTwo,
  Contact,
  Error,
  Event,
  EventDetails,
  Faq,
  InstructorRegistration,
  SignIn,
  SignUp,
  StudentRegistration,
  Teacher,
  TeacherDetails,

  MallaPage,
  AlumniMain,
  CentroMain,
  News,
  NewsDetails,
  ScePage,
  OportunidadPage,
  Sandbox,
} from '../pages';
import MainPage from '../pages/home';
import Docente from '../pages/docente';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

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

  return (
    <div className="App">
      {isLoading && <Preloader />}
      <ScrollToTop />
      <LoadTop />
      <Routes>
        <Route path="/" element={<MainPage/>} />

        <Route path="/about-us" element={<About />} />
        <Route path="/event" element={<Event />} />
        <Route path="/event-details" element={<EventDetails />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/teacher-details" element={<TeacherDetails />} />
        <Route path="/instructor-registration" element={<InstructorRegistration />}/>
        <Route path="/student-registration" element={<StudentRegistration />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/registro-docente" element={<Docente />} />
        <Route path="/blog-1" element={<Blog />} />
        <Route path="/blog-2" element={<BlogTwo />} />
        <Route path="/blog-sidebar" element={<BlogSidebar />} />
        <Route path="/blog-details" element={<BlogDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Error />} />

        <Route path="/malla" element={<MallaPage/>} />
        <Route path="/alumni" element={<AlumniMain />} />
        <Route path="/centro" element={<CentroMain />} />
        <Route path="/news" element={<News/>}/>
        <Route path="/news-details/:id" element={<NewsDetails />} />
        <Route path="/sce" element={<ScePage/>}/>
        <Route path="/oportunidades" element={<OportunidadPage/>}/>
        <Route path="/sandbox" element={<Sandbox/>}/>
      </Routes>
    </div>
  );
}

export default App;
