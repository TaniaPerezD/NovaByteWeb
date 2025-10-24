function TableRow({ semestre, materias, titulares, handleMouseEnter, handleMouseLeave, setSelectedMateria }) {
    return (
        <tr>
            <td className="mallaSemestresNum">{semestre}</td>
            {titulares.slice(1).map((titular, index) => {
                const materiasDelTitular = materias.filter(materia => materia.titular === titular.name);
                const rows = [];

                for (let i = 0; i < materiasDelTitular.length; i += 3) {
                    rows.push(materiasDelTitular.slice(i, i + 3));
                }

                return (
                    <td key={index}>
                        {rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="materia-row">
                                {row.map((materia) => (
                                    <div
                                        key={materia.id}
                                        id={`materia-${materia.sigla}`}
                                        className="materia-cell"
                                        onMouseEnter={() => handleMouseEnter(materia)}
                                        onMouseLeave={() => handleMouseLeave(materia)}
                                        onClick={() => setSelectedMateria(materia)}
                                    >
                                        <span>{materia.sigla} / {materia.costo}</span><br />
                                        <span className="mallaNombreMateria">{materia.nombre}</span><br />
                                        <span className="prerequisitos">Req: {materia.prerequisitos.length > 0 ? materia.prerequisitos.join(", ") : "Ninguno"}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </td>
                );
            })}
        </tr>
    );
}export default TableRow;