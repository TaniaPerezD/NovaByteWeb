import React, { useState } from "react";
import TableHeader from "./TableHeader.jsx";
import TableRow from "./TableRow.jsx";
import Tarjeta from "./Tarjeta.jsx";


const Titulares = [
    { name: "S" },
    { name: "BÁSICAS Y GENÉRICAS" },
    { name: "INNOVACIÓN EMPRESARIAL" },
    { name: "GESTIÓN EMPRESARIAL" },
    { name: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN" },
    { name: "LIBRES"}
];

const materias = [
    { id: 1, sigla: "MAT-132", nombre: "Cálculo I", prerequisitos: [], abre: ["MAT-133","MAT-142"] , semestre: 1, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 2, sigla: "ECO-100", nombre: "Economía General", prerequisitos: [], abre: [], semestre: 1, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 3, sigla: "CAR-109", nombre: "Escritura Académica", prerequisitos: [], abre: ["ADM-182"], semestre: 1, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 4, sigla: "MAT-133", nombre: "Cálculo II", prerequisitos: ["MAT-132"], abre: [], semestre: 2, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 5, sigla: "ADM-182", nombre: "Procesos del Método Científico", abre: [], prerequisitos: ["CAR-109"], semestre: 2, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 6, sigla: "MAT-123", nombre: "Álgebra Lineal", prerequisitos: [], abre: ["MAT-251"], semestre: 3, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 7, sigla: "MAT-142", nombre: "Probabilidad y Estadística I", prerequisitos: ["MAT-132"], abre: ["ICO-211","MAT-143"], semestre: 3, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 8, sigla: "FHC-140", nombre: "Formación Humano Cristiana I", prerequisitos: [], abre: ["FHC-240"], semestre: 3, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 9, sigla: "MAT-143", nombre: "Probabilidad y Estadística II", prerequisitos: ["MAT-142"], abre: [], semestre: 4, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 10, sigla: "FHC-240", nombre: "Formación Humano Cristiana II", prerequisitos: ["FHC-140"], abre: ["FHC-340"], semestre: 6, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 11, sigla: "FHC-340", nombre: "Formación Humano Cristiana III", prerequisitos: ["FHC-240"], abre: [], semestre: 7, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 12, sigla: "IIE-382", nombre: "Prácticas Pre profesionales", prerequisitos: ["FHC-240","IMT-313","ADM-266","IIE-300","IIE-261","MAT-252"], abre: [], semestre: 8, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 5" },
    { id: 13, sigla: "IEE-383", nombre: "Taller de Grado I", prerequisitos: ["FHC-340","ADM-312","ICO-232","ADM-282","SIS-324"], abre: ["IIE-384"], semestre: 8, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 15" },
    { id: 14, sigla: "IIE-384", nombre: "Taller de Grado II", prerequisitos: ["IEE-383"], abre: [], semestre: 9, titular: "BÁSICAS Y GENÉRICAS", costo: "UVE 15" },

    { id: 15, sigla: "ADM-255", nombre: "Emprendimientos y Startup", prerequisitos: ["ICO-221"], abre: ["ADM-352"], semestre: 4, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 16, sigla: "ADM-254", nombre: "Taller de Innovación Digital", prerequisitos: ["ADM-225"], abre: ["IIE-221","ADM-265"], semestre: 4, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 5" },
    { id: 17, sigla: "ADM-352", nombre: "Emprendimiento y Plan de Negocios", prerequisitos: ["ADM-255"], abre: [], semestre: 5, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 18, sigla: "IIE-221", nombre: "Creatividad aplicada a los Negocios", prerequisitos: ["ADM-254"], abre: ["IMT-313"], semestre: 5, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 19, sigla: "ADM-265", nombre: "Gestión de Procesos ", prerequisitos: ["ADM-254"], abre: ["ADM-266","ADM-312"], semestre: 5, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 20, sigla: "ICO-233", nombre: "Innovación, Desarrollo y Tecnología", prerequisitos: ["ICO-131"], abre: [], semestre: 5, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 6" },
    { id: 21, sigla: "IMT-313", nombre: "Diseño Superior de Ingeniería", prerequisitos: ["IIE-221","ICO-131"], abre: [], semestre: 6, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 22, sigla: "ADM-266", nombre: "Gerencia de Operaciones y Tecnología ", prerequisitos: ["ADM-265"], abre: ["ICO-232","ADM-312"], semestre: 6, titular: "INNOVACIÓN EMPRESARIAL", costo: "UVE 7" },
    
    { id: 23, sigla: "CPA-111", nombre: "Contabilidad Básica", prerequisitos: [], abre: ["ICO-221"], semestre: 1, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 24, sigla: "IIE-111", nombre: "Gestión de Innovación Empresarial I", prerequisitos: [], abre: ["IIE-112"], semestre: 1, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 25, sigla: "ICO-111", nombre: "Fundamentos del Marketing", prerequisitos: [], abre: ["ADM-312"], semestre: 2, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 5" },
    { id: 26, sigla: "IIE-112", nombre: "Gestión de Innovación Empresarial II", prerequisitos: ["IIE-111"], abre: ["ADM-225"], semestre: 2, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 27, sigla: "ICO-221", nombre: "Finanzas I", prerequisitos: ["CPA-111"], abre: ["ADM-255","ADM-312"], semestre: 3, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 5" },
    { id: 28, sigla: "ADM-225", nombre: "Comportamiento Organizacional", prerequisitos: ["IIE-112"], abre: ["ADM-254","IIE-261"], semestre: 3, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 29, sigla: "ICO-211", nombre: "Investigación de Mercados I", prerequisitos: ["MAT-142"], abre: [], semestre: 4, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 30, sigla: "ADM-312", nombre: "Dirección Estratégica I", prerequisitos: ["ICO-111","ADM-266","ICO-221"], abre: [], semestre: 7, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 5" },
    { id: 31, sigla: "ICO-232", nombre: "Logística y Cadena de Suministros", prerequisitos: ["ADM-266"], abre: ["ADM-321"], semestre: 7, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },
    { id: 32, sigla: "ADM-282", nombre: "Ética Profesional", prerequisitos: ["IIE-300"], abre: [], semestre: 7, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 5" },
    { id: 33, sigla: "ADM-321", nombre: "Taller de Habilidades Blandas", prerequisitos: ["ICO-232"], abre: [], semestre: 8, titular: "GESTIÓN EMPRESARIAL", costo: "UVE 7" },


    { id: 34, sigla: "SIS-141", nombre: "Introducción a los Sistemas de Información", prerequisitos: [], abre: ["SIS-143"], semestre: 2, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 5" },
    { id: 35, sigla: "SIS-111", nombre: "Introducción a la Programación", prerequisitos: [], abre: ["SIS-112"], semestre: 2, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 6" },
    { id: 36, sigla: "SIS-143", nombre: "Sistemas de Información", prerequisitos: ["SIS-141"], abre: ["ICO-131"], semestre: 3, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 7" },
    { id: 37, sigla: "SIS-112", nombre: "Programación I", prerequisitos: ["SIS-111"], abre: [], semestre: 3, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 6" },
    { id: 38, sigla: "ICO-131", nombre: "Tecnologías y Sistemas de Información", prerequisitos: ["SIS-143"], abre: ["IIE-300","ICO-233","IIE-201","IMT-313"], semestre: 4, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 5" },
    { id: 39, sigla: "IIE-201", nombre: "Informática Aplicada a la Gestión Empresarial", prerequisitos: ["ICO-131"],abre: [], semestre: 5, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 6" },
    { id: 40, sigla: "MAT-251", nombre: "Investigación Operativa I", prerequisitos: ["MAT-123"], abre: ["MAT-252"], semestre: 5, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 5" },
    { id: 41, sigla: "IIE-300", nombre: "Business Intelligence", prerequisitos: ["ICO-131"], abre: ["SIS-324","ADM-282"], semestre: 6, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 7" },
    { id: 42, sigla: "IIE-261", nombre: "Gestión del Conocimiento e Inteligencia Artificial", prerequisitos: ["ADM-225"], abre: [], semestre: 6, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 7" },
    { id: 43, sigla: "MAT-252", nombre: "Investigación Operativa II y Laboratorio", prerequisitos: ["MAT-251"], abre: [], semestre: 6, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 7" },
    { id: 44, sigla: "SIS-324", nombre: "Auditoría de Sistemas", prerequisitos: ["IIE-300"], abre: [], semestre: 7, titular: "TECNOLOGÍA Y SISTEMAS DE INFORMACIÓN", costo: "UVE 6" },

    { id: 45, sigla: "L-1", nombre: "Libre I", prerequisitos: [],abre: [], semestre: 6, titular: "LIBRES", costo: "UVE 5" },
    { id: 46, sigla: "L-2", nombre: "Libre II", prerequisitos: [],abre: [], semestre: 7, titular: "LIBRES", costo: "UVE 5" },

];

const Malla = () => { // Agregar el const Malla = ({ materias, titulares }) para recibir como props
    const [selectedMateria, setSelectedMateria] = useState(null);

    const groupedBySemestre = materias.reduce((acc, materia) => {
        if (!acc[materia.semestre]) acc[materia.semestre] = [];
        acc[materia.semestre].push(materia);
        return acc;
    }, {});

    const handleMouseEnter = (materia) => {
        materia.prerequisitos.forEach((req) => {
            const elem = document.getElementById(`materia-${req}`);
            if (elem) elem.classList.add('prerequisitoHighlight');
        });
    
        materia.abre.forEach((abre) => {
            const elem = document.getElementById(`materia-${abre}`);
            if (elem) elem.classList.add('abreHighlight');
        });
    };
    
    const handleMouseLeave = (materia) => {
        materia.prerequisitos.forEach((req) => {
            const elem = document.getElementById(`materia-${req}`);
            if (elem) elem.classList.remove('prerequisitoHighlight');
        });
    
        materia.abre.forEach((abre) => {
            const elem = document.getElementById(`materia-${abre}`);
            if (elem) elem.classList.remove('abreHighlight');
        });
    };

    return (
        <div className={"table-container"}>
            <table className={"curriculum-table"}>
                <thead>
                    <tr className={"header"}>
                        <TableHeader titulares={Titulares} />
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(groupedBySemestre).map(([semestre, materias]) => (
                        <TableRow
                            key={semestre}
                            semestre={semestre}
                            materias={materias}
                            titulares={Titulares}
                            handleMouseEnter={handleMouseEnter}
                            handleMouseLeave={handleMouseLeave}
                            setSelectedMateria={setSelectedMateria}
                        />
                    ))}
                </tbody>
            </table>
            <Tarjeta selectedMateria={selectedMateria} onClose={() => setSelectedMateria(null)} />
        </div>
    );
}; export default Malla;