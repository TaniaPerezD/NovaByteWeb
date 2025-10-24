function TableHeader({ titulares }) {
    return (
        <>
            {titulares.map((titular, index) => (
                <th key={index} className="table-header">{titular.name}</th>
            ))}
        </>
    );
} export default TableHeader;