import React from 'react';
import { Link } from 'react-router-dom';

const Pagination = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const blockSize = 10; // Cantidad por bloque
    const currentBlock = Math.ceil(currentPage / blockSize);

    const blockStart = (currentBlock - 1) * blockSize + 1;
    const blockEnd = Math.min(currentBlock * blockSize, totalPages);

    const showPreviousBlock = currentBlock > 1;
    const showNextBlock = blockEnd < totalPages;

    return (
    <div className="it-pagination">
        <nav>
            <ul>
            {showPreviousBlock && (
                <li>
                <Link to="#" onClick={() => onPageChange(blockStart - 1)}>
                    &laquo;
                </Link>
                </li>
            )}
            {Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => (
                <li key={blockStart + i}>
                <Link
                    to="#"
                    onClick={() => onPageChange(blockStart + i)}
                    className={currentPage === blockStart + i ? 'current' : ''}
                >
                    {blockStart + i}
                </Link>
                </li>
            ))}

            {showNextBlock && (
                <li>
                <Link to="#" onClick={() => onPageChange(blockEnd + 1)}>
                    &raquo;
                </Link>
                </li>
            )}
            </ul>
        </nav>
    </div>
    );
};export default Pagination;